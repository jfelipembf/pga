import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import clientsEvaluationService from "../../services/ClientsEvaluation"

export const useEvaluationDraft = ({
  idActivity,
  selectedTopicId,
  clients,
  excludedIds,
  defaultLevelId,
  withLoading,
  activeEventId, // NOVO
} = {}) => {
  const [draftLevelsByTopicId, setDraftLevelsByTopicId] = useState({})

  const lastEvalCacheRef = useRef(new Map())
  const eventEvalCacheRef = useRef(new Map()) // Cache para avaliações do evento atual

  // Busca avaliação específica do evento
  const getEventEvalCached = useCallback(async ({ idClient, eventPlanId }) => {
    const key = `${String(idClient)}-${String(eventPlanId)}`
    if (eventEvalCacheRef.current.has(key)) return eventEvalCacheRef.current.get(key)

    let val = null
    try {
      val = await clientsEvaluationService.getClientEvaluationByEvent({
        idClient: String(idClient),
        eventPlanId: String(eventPlanId),
      })
    } catch (e) {
      console.warn("Erro ao buscar eval do evento", e)
    }

    eventEvalCacheRef.current.set(key, val)
    return val
  }, [])

  const getLastSnapshotCached = useCallback(async ({ idClient, idActivity: actId }) => {
    const key = `${String(idClient)}-${String(actId)}`
    if (lastEvalCacheRef.current.has(key)) return lastEvalCacheRef.current.get(key)

    const snap = await clientsEvaluationService.getLastClientEvaluationSnapshot({
      idClient: String(idClient),
      idActivity: String(actId),
    })

    const value = snap || null
    lastEvalCacheRef.current.set(key, value)
    return value
  }, [])

  useEffect(() => {
    lastEvalCacheRef.current = new Map()
    eventEvalCacheRef.current = new Map()
    setDraftLevelsByTopicId({})
  }, [idActivity, activeEventId]) // Reset se mudar atividade ou evento

  const currentTopicLevels = useMemo(() => {
    const tId = String(selectedTopicId || "")
    return (tId && draftLevelsByTopicId?.[tId]) || {}
  }, [draftLevelsByTopicId, selectedTopicId])

  const dirtyCount = useMemo(() => {
    const d = draftLevelsByTopicId || {}
    return Object.keys(d).reduce((acc, tId) => acc + Object.keys(d[tId] || {}).length, 0)
  }, [draftLevelsByTopicId])

  const handleLevelChange = useCallback(
    (clientId, levelId) => {
      const sId = String(clientId)
      const tId = String(selectedTopicId || "")
      if (!tId) return

      setDraftLevelsByTopicId(prev => ({
        ...prev,
        [tId]: {
          ...(prev?.[tId] || {}),
          [sId]: String(levelId),
        },
      }))
    },
    [selectedTopicId]
  )

  useEffect(() => {
    let cancelled = false

    const prefill = async () => {
      if (!idActivity || !selectedTopicId) return
      if (!Array.isArray(clients) || clients.length === 0) return

      const tId = String(selectedTopicId)
      if (draftLevelsByTopicId?.[tId]) return

      const excluded = excludedIds instanceof Set ? excludedIds : new Set(excludedIds || [])
      const activeclients = clients.filter(s => !excluded.has(String(s.id)))
      if (!activeclients.length) return

      const run = async () => {
        const results = await Promise.all(
          activeclients.map(async s => {
            const sId = String(s.id)

            // Lógica de prioridade:
            // 1. Avaliação do evento atual (se houver evento ativo)
            // 2. Último snapshot geral (fallback)

            let sourceEval = null

            if (activeEventId) {
              sourceEval = await getEventEvalCached({ idClient: sId, eventPlanId: activeEventId })
            }

            if (!sourceEval) {
              sourceEval = await getLastSnapshotCached({ idClient: sId, idActivity })
            }

            const base =
              sourceEval?.levelsByTopicId && typeof sourceEval.levelsByTopicId === "object"
                ? sourceEval.levelsByTopicId
                : {}

            const lastForTopic = base?.[tId]
            const levelId =
              lastForTopic?.levelId != null ? String(lastForTopic.levelId) : String(defaultLevelId || "")
            return { sId, levelId }
          })
        )

        if (cancelled) return

        const topicMap = {}
        results.forEach(r => {
          topicMap[r.sId] = r.levelId
        })

        setDraftLevelsByTopicId(prev => ({
          ...prev,
          [tId]: topicMap,
        }))
      }

      if (withLoading) return withLoading("prefill", run)
      return run()
    }

    prefill()
    return () => {
      cancelled = true
    }
  }, [
    idActivity,
    selectedTopicId,
    clients,
    excludedIds,
    defaultLevelId,
    withLoading,
    draftLevelsByTopicId,
    getLastSnapshotCached,
    getEventEvalCached,
    activeEventId, // NOVO
  ])

  return {
    draftLevelsByTopicId,
    setDraftLevelsByTopicId,
    currentTopicLevels,
    dirtyCount,
    handleLevelChange,
  }
}

export default useEvaluationDraft
