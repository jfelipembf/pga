import { useState, useCallback, useEffect, useRef } from 'react'
import { EvaluationService } from '../../../services/Evaluations/EvaluationService'
import { useTenant } from '../../../hooks/useTenant'

export const useEvaluationDraft = ({
    idActivity,
    selectedTopicId,
    clients,
    excludedIds,
    defaultLevelId,
    withLoading,
    activeEventId
}) => {
    const { idTenant, idBranch } = useTenant()
    const [draftLevelsByTopicId, setDraftLevelsByTopicId] = useState({})
    const prefilledRef = useRef(new Set())

    // Carregar avaliações (do Ciclo Atual ou Histórico)
    useEffect(() => {
        if (!idTenant || !idBranch || !idActivity || !clients.length) return

        // Identificar alunos que ainda não foram "processados" para carregamento
        const missingClientIds = clients
            .map(c => String(c.id))
            .filter(id => !prefilledRef.current.has(`${idActivity}_${id}`))

        if (missingClientIds.length === 0) return

        const loadEvaluations = async () => {
            try {
                // 1. Prioridade: Buscar avaliações salvas no CICLO ATUAL
                let currentCycleEvaluations = []
                if (activeEventId) {
                    currentCycleEvaluations = await EvaluationService.getEvaluationsByActivityEvent(idTenant, idBranch, idActivity, activeEventId)
                }

                // 2. Fallback: Buscar últimos níveis (Histórico) para quem não tem avaliação no ciclo atual
                const clientsInCurrentCycle = new Set(currentCycleEvaluations.map(e => String(e.idStudent)))
                const clientsNeedingHistory = missingClientIds.filter(id => !clientsInCurrentCycle.has(id))

                let historyLevels = {}
                if (clientsNeedingHistory.length > 0) {
                    historyLevels = await EvaluationService.getLatestLevelsForClients(idTenant, idBranch, idActivity, clientsNeedingHistory)
                }

                setDraftLevelsByTopicId(prev => {
                    const newDraft = { ...prev }

                    // Processar dados do Ciclo Atual (mapeando critérios por tópico)
                    currentCycleEvaluations.forEach(evalDoc => {
                        const clientId = String(evalDoc.idStudent)
                        if (evalDoc.criteria && Array.isArray(evalDoc.criteria)) {
                            evalDoc.criteria.forEach(crit => {
                                const tId = String(crit.id)
                                if (!newDraft[tId]) newDraft[tId] = {}
                                newDraft[tId][clientId] = crit.idLevel
                            })
                        }
                    })

                    // Processar dados do Histórico (Fallback para o tópico selecionado)
                    if (selectedTopicId) {
                        if (!newDraft[selectedTopicId]) newDraft[selectedTopicId] = {}
                        Object.entries(historyLevels).forEach(([clientId, levelId]) => {
                            // Só aplica se o Ciclo Atual não tiver preenchido nada para ESSE tópico/aluno
                            if (!newDraft[selectedTopicId][clientId]) {
                                newDraft[selectedTopicId][clientId] = levelId
                            }
                        })
                    }

                    return newDraft
                })

                // Marcar todos como carregados
                missingClientIds.forEach(id => prefilledRef.current.add(`${idActivity}_${id}`))

            } catch (error) {
                console.error("Erro ao carregar rascunhos de avaliação:", error)
            }
        }

        if (withLoading) withLoading('prefill', loadEvaluations)
        else loadEvaluations()

    }, [idTenant, idBranch, idActivity, clients, activeEventId, withLoading, selectedTopicId])

    const currentTopicLevels = draftLevelsByTopicId[selectedTopicId] || {}

    const handleLevelChange = useCallback((clientId, levelId) => {
        if (!selectedTopicId) return

        setDraftLevelsByTopicId(prev => ({
            ...prev,
            [selectedTopicId]: {
                ...(prev[selectedTopicId] || {}),
                [clientId]: levelId
            }
        }))
    }, [selectedTopicId])

    const dirtyCount = Object.entries(currentTopicLevels).filter(([clientId, levelId]) => {
        const isExcluded = new Set(excludedIds || []).has(String(clientId))
        return !isExcluded && !!levelId
    }).length

    return {
        draftLevelsByTopicId,
        currentTopicLevels,
        dirtyCount,
        handleLevelChange
    }
}
