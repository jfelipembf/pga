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

                let historyEvaluations = {}
                if (clientsNeedingHistory.length > 0) {
                    historyEvaluations = await EvaluationService.getLatestEvaluationsForClients(idTenant, idBranch, idActivity, clientsNeedingHistory)
                }

                setDraftLevelsByTopicId(prev => {
                    const newDraft = { ...prev }

                    // 1. Processar dados do Ciclo Atual (mapeando critérios por tópico) - PRIORITÁRIO
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

                    // 2. Processar dados do Histórico (Fallback para quem não tem no ciclo atual)
                    // Percorre todos os alunos que trouxeram histórico
                    Object.entries(historyEvaluations).forEach(([clientId, evalDoc]) => {
                        const cId = String(clientId)

                        // Se houver critérios detalhados, preenchemos todos os tópicos encontrados
                        if (evalDoc.criteria && Array.isArray(evalDoc.criteria)) {
                            evalDoc.criteria.forEach(crit => {
                                const tId = String(crit.id)
                                if (!newDraft[tId]) newDraft[tId] = {}
                                // Só aplica se o Ciclo Atual não tiver preenchido nada para esse aluno/tópico
                                if (!newDraft[tId][cId]) {
                                    newDraft[tId][cId] = crit.idLevel
                                }
                            })
                        }
                        // Caso seja uma avaliação antiga sem critérios, podemos usar o idLevel como fallback para o tópico selecionado
                        else if (selectedTopicId && evalDoc.idLevel) {
                            if (!newDraft[selectedTopicId]) newDraft[selectedTopicId] = {}
                            if (!newDraft[selectedTopicId][cId]) {
                                newDraft[selectedTopicId][cId] = evalDoc.idLevel
                            }
                        }
                    })

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
