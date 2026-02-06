import { useCallback } from 'react'
import { EvaluationService } from '../../../services/Evaluations/EvaluationService'
import { automationService } from '../../../services/Automation/AutomationService'
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

                // Preparar dados e Promises de salvamento
                const savePromises = evaluationClients.map(async (client) => {
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
                            levelName: levelDoc?.title || "Avaliado", // Aqui salvamos o nome do nível!
                            achieved: levelDoc?.isPassing !== false,
                            updatedAt: new Date()
                        }
                    }).filter(Boolean)

                    if (criteria.length === 0) return null

                    // Registramos a avaliação "mestre" para o aluno neste ciclo
                    await EvaluationService.registerEvaluation(idTenant, idBranch, user, {
                        idStudent: clientId,
                        idActivity: idActivity,
                        idEvent: activeEventId,
                        idClass: classId || null,
                        idInstructor: user.uid,
                        idLevel: defaultLevelId, // Nível geral
                        date: new Date().toISOString().split('T')[0],
                        criteria: criteria,
                        status: 'pending'
                    })

                    return { client, criteria }
                })

                // Aguardar todos os salvamentos
                const results = await Promise.all(savePromises)

                // Disparar Automações (Fire and Forget para não travar UI, mas logar erro)
                const validResults = results.filter(Boolean)
                if (validResults.length > 0) {
                    processAutomations(idTenant, validResults)
                }

                toast.success(`Avaliações de ${validResults.length} alunos salvas com sucesso!`)

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

    const processAutomations = async (tenantId, results) => {
        try {
            const promises = results.map(({ client, criteria }) => {
                // Formatar resultados para mensagem com estilo (Agrupado por Objetivo)
                const groupedByObjective = criteria.reduce((acc, curr) => {
                    const objectiveTitle = topicMetaById[curr.id]?.objectiveTitle || "Geral"
                    if (!acc[objectiveTitle]) acc[objectiveTitle] = []
                    acc[objectiveTitle].push(curr)
                    return acc
                }, {})

                const resultsText = Object.entries(groupedByObjective).map(([objective, items]) => {
                    const itemsText = items.map(c => `🔹 ${c.name}\n   ⭐ ${c.levelName}`).join('\n\n')
                    return `🏊 ${objective}\n\n${itemsText}`
                }).join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n')

                return automationService.emit(tenantId, 'EVALUATION_RESULT', {
                    student: client.name,
                    studentName: client.name, // Fallback alias
                    name: client.name, // Fallback alias
                    phone: client.phone || client.cellPhone || client.responsavelPhone,
                    results: resultsText,
                    date: new Date().toLocaleDateString('pt-BR')
                })
            })
            await Promise.allSettled(promises)
        } catch (e) {
            console.error("Erro ao processar automações de avaliação", e)
        }
    }

    const sendEvaluationToClient = useCallback(async (client) => {
        const clientId = String(client.id)

        // Reconstrói critérios (Lógica compartilhada com saveAll)
        const criteria = allTopicIds.map(topicId => {
            const meta = topicMetaById[topicId] || {}
            let levelId = draftLevelsByTopicId[topicId]?.[clientId]
            let levelDoc = null

            // Encontrar o nível base para fallback
            const baseLevel = levels && levels.length > 0
                ? levels.reduce((prev, curr) => ((curr.order || 0) < (prev.order || 0) ? curr : prev), levels[0])
                : null

            if (levelId) {
                levelDoc = levels.find(l => String(l.id) === String(levelId))
            } else if (baseLevel) {
                levelDoc = baseLevel
            }

            if (!levelDoc) return null

            return {
                id: topicId,
                name: meta.title || "Tópico",
                levelName: levelDoc.title || "Avaliado",
                achieved: levelDoc.isPassing !== false
            }
        }).filter(Boolean)

        if (criteria.length === 0) {
            toast.warning("Não há critérios avaliados para este aluno.")
            return
        }

        // Agrupar critérios por Objetivo para melhor visualização
        const groupedByObjective = criteria.reduce((acc, curr) => {
            const objectiveTitle = topicMetaById[curr.id]?.objectiveTitle || "Geral"
            if (!acc[objectiveTitle]) acc[objectiveTitle] = []
            acc[objectiveTitle].push(curr)
            return acc
        }, {})

        const resultsText = Object.entries(groupedByObjective).map(([objective, items]) => {
            const itemsText = items.map(c => `🔹 ${c.name}\n   ⭐ ${c.levelName}`).join('\n\n')
            return `🏊 ${objective}\n\n${itemsText}`
        }).join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n')

        try {
            await automationService.emit(idTenant, 'EVALUATION_RESULT', {
                student: client.name,
                studentName: client.name,
                name: client.name,
                phone: client.phone || client.cellPhone || client.responsavelPhone,
                results: resultsText,
                date: new Date().toLocaleDateString('pt-BR')
            })
            toast.success(`Mensagem enviada para ${client.name}!`)
        } catch (e) {
            console.error(e)
            toast.error("Erro ao enviar mensagem.")
        }
    }, [idTenant, allTopicIds, topicMetaById, draftLevelsByTopicId, levels])

    return { saveAll, sendEvaluationToClient }
}
