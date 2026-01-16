import { useEffect, useMemo, useState } from "react"

import { listObjectivesWithTopics } from "../../services/Activity/activities.objectives.service"

export const useActivityObjectivesTopics = ({ idActivity, withLoading } = {}) => {
  const [objectives, setObjectives] = useState([])
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("")
  const [selectedTopicId, setSelectedTopicId] = useState("")

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!idActivity) {
        setObjectives([])
        setSelectedObjectiveId("")
        setSelectedTopicId("")
        return
      }

      const run = async () => {
        const data = await listObjectivesWithTopics(idActivity)
        const safe = Array.isArray(data) ? data : []
        if (cancelled) return

        setObjectives(safe)

        const keepObj = safe.find(o => String(o.id) === String(selectedObjectiveId)) || safe[0] || null
        const keepTopics = Array.isArray(keepObj?.topics) ? keepObj.topics : []
        const keepTopic =
          keepTopics.find(t => String(t.id) === String(selectedTopicId)) || keepTopics[0] || null

        setSelectedObjectiveId(keepObj?.id ? String(keepObj.id) : "")
        setSelectedTopicId(keepTopic?.id ? String(keepTopic.id) : "")
      }

      try {
        if (withLoading) {
          await withLoading("objectives", run)
        } else {
          await run()
        }
      } catch (e) {
        console.error("Erro ao carregar objetivos/tópicos", e)
        if (!cancelled) {
          setObjectives([])
          setSelectedObjectiveId("")
          setSelectedTopicId("")
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idActivity, withLoading])

  const selectedObjective = useMemo(() => {
    return objectives.find(o => String(o.id) === String(selectedObjectiveId)) || null
  }, [objectives, selectedObjectiveId])

  const topics = useMemo(() => {
    const t = selectedObjective?.topics
    return Array.isArray(t) ? t : []
  }, [selectedObjective])

  const selectedTopic = useMemo(() => {
    return topics.find(t => String(t.id) === String(selectedTopicId)) || null
  }, [topics, selectedTopicId])

  const allTopicIds = useMemo(() => {
    const ids = []
    objectives.forEach(obj => {
      const t = Array.isArray(obj?.topics) ? obj.topics : []
      t.forEach(tp => {
        if (tp?.id != null) ids.push(String(tp.id))
      })
    })
    return [...new Set(ids)]
  }, [objectives])

  const topicMetaById = useMemo(() => {
    const map = {}
    objectives.forEach(obj => {
      const oId = obj?.id != null ? String(obj.id) : ""
      const oName = obj?.title || ""
      const oOrder = obj?.order != null ? Number(obj.order) : 0

      const t = Array.isArray(obj?.topics) ? obj.topics : []
      t.forEach(tp => {
        const tId = tp?.id != null ? String(tp.id) : ""
        if (!tId) return
        map[tId] = {
          objectiveId: oId,
          objectiveName: oName,
          objectiveOrder: oOrder,
          topicId: tId,
          topicName: tp?.description || "",
          topicOrder: tp?.order != null ? Number(tp.order) : 0,
        }
      })
    })
    return map
  }, [objectives])

  const handleSelectObjective = nextObjectiveId => {
    const id = String(nextObjectiveId || "")
    setSelectedObjectiveId(id)

    const nextObj = objectives.find(o => String(o.id) === id)
    const nextTopics = Array.isArray(nextObj?.topics) ? nextObj.topics : []
    setSelectedTopicId(nextTopics?.[0]?.id != null ? String(nextTopics[0].id) : "")
  }

  const handleSelectTopic = nextTopicId => {
    setSelectedTopicId(String(nextTopicId || ""))
  }

  const handleNext = () => {
    if (!selectedObjective) return

    const objIndex = objectives.findIndex(o => String(o.id) === String(selectedObjectiveId))
    const topicIndex = topics.findIndex(t => String(t.id) === String(selectedTopicId))

    if (topicIndex >= 0 && topicIndex < topics.length - 1) {
      setSelectedTopicId(String(topics[topicIndex + 1].id))
      return
    }

    if (objIndex >= 0 && objIndex < objectives.length - 1) {
      const nextObj = objectives[objIndex + 1]
      const nextTopics = Array.isArray(nextObj?.topics) ? nextObj.topics : []
      setSelectedObjectiveId(String(nextObj.id))
      setSelectedTopicId(nextTopics?.[0]?.id != null ? String(nextTopics[0].id) : "")
    }
  }

  const handlePrev = () => {
    if (!selectedObjective) return

    const objIndex = objectives.findIndex(o => String(o.id) === String(selectedObjectiveId))
    const topicIndex = topics.findIndex(t => String(t.id) === String(selectedTopicId))

    if (topicIndex > 0) {
      setSelectedTopicId(String(topics[topicIndex - 1].id))
      return
    }

    if (objIndex > 0) {
      const prevObj = objectives[objIndex - 1]
      const prevTopics = Array.isArray(prevObj?.topics) ? prevObj.topics : []
      setSelectedObjectiveId(String(prevObj.id))
      setSelectedTopicId(prevTopics.length ? String(prevTopics[prevTopics.length - 1].id) : "")
    }
  }

  const isLastTopicOfLastObjective = useMemo(() => {
    const objIndex = objectives.findIndex(o => String(o.id) === String(selectedObjectiveId))
    const topicIndex = topics.findIndex(t => String(t.id) === String(selectedTopicId))
    if (!selectedObjectiveId || !selectedTopicId) return false
    if (objIndex !== objectives.length - 1) return false
    return topicIndex === topics.length - 1
  }, [objectives, topics, selectedObjectiveId, selectedTopicId])

  const isFirstTopicOfFirstObjective = useMemo(() => {
    const objIndex = objectives.findIndex(o => String(o.id) === String(selectedObjectiveId))
    const topicIndex = topics.findIndex(t => String(t.id) === String(selectedTopicId))
    if (!selectedObjectiveId || !selectedTopicId) return false
    if (objIndex !== 0) return false
    return topicIndex === 0
  }, [objectives, topics, selectedObjectiveId, selectedTopicId])

  return {
    objectives,
    topics,
    selectedObjective,
    selectedTopic,
    selectedObjectiveId,
    selectedTopicId,
    setSelectedObjectiveId,
    setSelectedTopicId,
    allTopicIds,
    topicMetaById,
    handleSelectObjective,
    handleSelectTopic,
    handleNext,
    handlePrev,
    isLastTopicOfLastObjective,
    isFirstTopicOfFirstObjective,
  }
}

export default useActivityObjectivesTopics
