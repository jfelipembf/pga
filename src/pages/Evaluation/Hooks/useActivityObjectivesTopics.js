import { useState, useEffect, useMemo } from 'react'
import { ActivityService } from '../../../services/Admin/ActivityService'
import { useTenant } from '../../../hooks/useTenant'

export const useActivityObjectivesTopics = ({ idActivity, withLoading }) => {
    const { idTenant, idBranch } = useTenant()
    const [rawActivityData, setRawActivityData] = useState(null)

    // Selectors
    const [selectedObjectiveId, setSelectedObjectiveId] = useState("")
    const [selectedTopicId, setSelectedTopicId] = useState("")

    useEffect(() => {
        if (!idTenant || !idBranch || !idActivity) return

        const load = async () => {
            try {
                const data = await ActivityService.findById(idTenant, idBranch, idActivity)
                setRawActivityData(data)

                const sortedObjectives = Object.values(data?.objectives || {})
                    .sort((a, b) => (a.order || 0) - (b.order || 0))

                if (sortedObjectives.length > 0) {
                    const firstObj = sortedObjectives[0]
                    setSelectedObjectiveId(String(firstObj.id))

                    const sortedTopics = Object.values(firstObj.topics || {})
                        .sort((a, b) => (a.order || 0) - (b.order || 0))

                    if (sortedTopics.length > 0) {
                        setSelectedTopicId(String(sortedTopics[0].id))
                    }
                } else {
                    setSelectedObjectiveId("")
                    setSelectedTopicId("")
                }
            } catch (error) {
                console.error("Erro ao carregar objetivos da atividade", error)
            }
        }

        if (withLoading) withLoading('objectives', load)
        else load()

    }, [idTenant, idBranch, idActivity, withLoading])

    const objectives = useMemo(() => {
        if (!rawActivityData?.objectives) return []
        return Object.values(rawActivityData.objectives)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
    }, [rawActivityData])

    const selectedObjective = useMemo(() =>
        objectives.find(o => String(o.id) === String(selectedObjectiveId)),
        [objectives, selectedObjectiveId])

    const topics = useMemo(() => {
        if (!selectedObjective?.topics) return []
        return Object.values(selectedObjective.topics)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
    }, [selectedObjective])

    // Se o tópico selecionado não estiver na lista (ex: trocou objetivo), seleciona o primeiro
    useEffect(() => {
        if (topics.length > 0) {
            const currentExists = topics.some(t => String(t.id) === String(selectedTopicId))
            if (!currentExists) {
                setSelectedTopicId(String(topics[0].id))
            }
        } else {
            setSelectedTopicId("")
        }
    }, [topics, selectedTopicId])

    // Flattened topics for navigation and meta
    const flatTopics = useMemo(() => {
        const list = []
        objectives.forEach(obj => {
            const objTopics = Object.values(obj.topics || {})
                .sort((a, b) => (a.order || 0) - (b.order || 0))
            objTopics.forEach(t => {
                list.push({
                    ...t,
                    objectiveId: obj.id,
                    objectiveTitle: obj.title
                })
            })
        })
        return list
    }, [objectives])

    const currentTopicIndex = useMemo(() =>
        flatTopics.findIndex(t => String(t.id) === String(selectedTopicId)),
        [flatTopics, selectedTopicId])

    const handleNext = () => {
        if (currentTopicIndex < flatTopics.length - 1) {
            const next = flatTopics[currentTopicIndex + 1]
            if (String(next.objectiveId) !== String(selectedObjectiveId)) {
                setSelectedObjectiveId(String(next.objectiveId))
            }
            setSelectedTopicId(String(next.id))
        }
    }

    const handlePrev = () => {
        if (currentTopicIndex > 0) {
            const prev = flatTopics[currentTopicIndex - 1]
            if (String(prev.objectiveId) !== String(selectedObjectiveId)) {
                setSelectedObjectiveId(String(prev.objectiveId))
            }
            setSelectedTopicId(String(prev.id))
        }
    }

    const topicMetaById = useMemo(() => {
        const meta = {}
        flatTopics.forEach(t => {
            meta[t.id] = {
                title: t.description,
                objectiveTitle: t.objectiveTitle,
                maxScore: t.maxScore || 10
            }
        })
        return meta
    }, [flatTopics])

    return {
        objectives,
        topics,
        selectedObjective,
        selectedObjectiveId,
        selectedTopicId,
        handleSelectObjective: setSelectedObjectiveId,
        handleSelectTopic: setSelectedTopicId,
        handleNext,
        handlePrev,
        isLastTopicOfLastObjective: currentTopicIndex === flatTopics.length - 1 || flatTopics.length === 0,
        isFirstTopicOfFirstObjective: currentTopicIndex <= 0,
        allTopicIds: flatTopics.map(t => t.id),
        topicMetaById
    }
}
