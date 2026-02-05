import { useCallback } from 'react'
import { EvaluationService } from '../../../services/Evaluations/EvaluationService'
import { useTenant } from '../../../hooks/useTenant'
import { toast } from 'react-toastify'

export const useSaveEvaluations = ({
    idActivity,
    classId,
    clients,
    excludedIds,
    draftLevelsByTopicId,
    allTopicIds,
    topicMetaById,
    defaultLevelId,
    levels,
    withLoading,
    activeEventId,
}) => {
    const { idTenant, idBranch, user } = useTenant()

    const saveAll = useCallback(async () => {
        if (!withLoading || !idActivity || !activeEventId) return

        const excludedSet = new Set(excludedIds || [])
        const evaluationClients = clients.filter(c => !excludedSet.has(String(c.id)))

        if (evaluationClients.length === 0) {
            toast.warning("Nenhum aluno selecionado para avaliação")
            return
        }

        await withLoading('saveAll', async () => {
            try {
                // Encontrar o nível base (menor ordem - Nível 0) para preenchimento automático
                const baseLevel = levels && levels.length > 0
                    ? levels.reduce((prev, curr) => ((curr.order || 0) < (prev.order || 0) ? curr : prev), levels[0])
                    : null

                // Para cada aluno, consolidamos os níveis de todos os tópicos avaliados
                const promises = evaluationClients.map(async (client) => {
                    const clientId = String(client.id)

                    // Montamos os critérios baseados nos rascunhos de cada tópico
                    // SE não houver avaliação manual, usa o nível base (Requisito: salvar todos como nível 0 se vazio)
                    const criteria = allTopicIds.map(topicId => {
                        const meta = topicMetaById[topicId] || {}
                        let levelId = draftLevelsByTopicId[topicId]?.[clientId]
                        let levelDoc = null

                        if (levelId) {
                            levelDoc = levels.find(l => String(l.id) === String(levelId))
                        } else if (baseLevel) {
                            // Preenchimento automático com Nível 0
                            levelDoc = baseLevel
                            levelId = baseLevel.id
                        }

                        if (!levelId) return null

                        return {
                            id: topicId,
                            name: meta.title || "Tópico",
                            idLevel: levelId,
                            levelName: levelDoc?.name || "Avaliado", // Aqui salvamos o nome do nível!
                            achieved: levelDoc?.isPassing !== false,
                            updatedAt: new Date()
                        }
                    }).filter(Boolean)

                    if (criteria.length === 0) return

                    // Registramos a avaliação "mestre" para o aluno neste ciclo
                    // Nota: O registerEvaluation no backend já resolve se cria ou edita.
                    return EvaluationService.registerEvaluation(idTenant, idBranch, user, {
                        idStudent: clientId,
                        idActivity: idActivity,
                        idEvent: activeEventId,
                        idClass: classId || null,
                        idInstructor: user.uid,
                        idLevel: defaultLevelId, // Nível geral (poderia ser calculado ou selecionado separadamente)
                        date: new Date().toISOString().split('T')[0],
                        criteria: criteria,
                        status: 'pending'
                    })
                })

                await Promise.all(promises)
                toast.success("Avaliações salvas com sucesso!")
            } catch (error) {
                console.error("Erro ao salvar avaliações:", error)
                toast.error(error.message || "Erro ao salvar avaliações")
            }
        })
    }, [
        idTenant, idBranch, user, idActivity, classId, clients, excludedIds,
        draftLevelsByTopicId, allTopicIds, topicMetaById, defaultLevelId,
        levels, withLoading, activeEventId
    ])

    return { saveAll }
}
