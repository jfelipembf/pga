import { useCallback, useState } from 'react'
import { EvaluationService } from '../../../services/Evaluations/EvaluationService'
import { automationService } from '../../../services/Automation/AutomationService'
import { useTenant } from '../../../hooks/useTenant'
import { toast } from 'react-toastify'
import { useAuth } from '../../../hooks/useAuth'
import moment from 'moment'
import { formatDate } from '../../../utils/date'

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
    const { idTenant, idBranch } = useTenant()
    const { user } = useAuth()

    // Status do envio em massa
    const [sendingStatus, setSendingStatus] = useState({
        loading: false,
        step: '',
        progress: 0, // 0 a 100
        currentClientName: ''
    })

    const saveAll = useCallback(async () => {
        if (!withLoading || !idActivity || !activeEventId) return

        const excludedSet = new Set(excludedIds || [])
        const evaluationClients = clients.filter(c => !excludedSet.has(String(c.id)))

        if (evaluationClients.length === 0) {
            toast.warning("Nenhum aluno selecionado para avaliação")
            return
        }

        if (!user || !user.uid) {
            toast.error("Usuário não identificado. Tente recarregar a página.")
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
                    const criteria = (allTopicIds || []).map(topicId => {
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
                            levelName: levelDoc?.title || "Avaliado",
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
                        idLevel: defaultLevelId,
                        date: new Date().toISOString().split('T')[0],
                        criteria: criteria,
                        status: 'pending'
                    })

                    return { client, criteria }
                })

                await Promise.all(savePromises)
                toast.success(`Avaliações salvas com sucesso!`)

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

    // Função Interna Reutilizável de Envio
    const processEvaluationMessage = useCallback(async (client) => {
        const clientId = String(client.id)

        // 1. Buscar histórico real do aluno
        const allStudentEvals = await EvaluationService.getStudentEvaluations(idTenant, idBranch, clientId)

        // Filtrar apenas avaliações desta atividade e ordenar (mais novas primeiro)
        const activityEvals = (allStudentEvals || [])
            .filter(ev => String(ev.idActivity) === String(idActivity))
            .sort((a, b) => moment(b.date).diff(moment(a.date)))

        // 2. Montar critérios da avaliação ATUAL (Draft ou que acabamos de salvar)
        const currentCriteria = (allTopicIds || []).map(topicId => {
            const meta = topicMetaById[topicId] || {}
            let levelId = draftLevelsByTopicId[topicId]?.[clientId]
            let levelDoc = null

            // Fallback para nível base se não foi avaliado
            const baseLevel = levels && levels.length > 0
                ? levels.reduce((prev, curr) => ((curr.order || 0) < (prev.order || 0) ? curr : prev), levels[0])
                : null

            if (levelId) {
                levelDoc = levels.find(l => String(l.id) === String(levelId))
            } else if (baseLevel) {
                levelDoc = baseLevel
                levelId = baseLevel.id
            }

            if (!levelDoc) return null

            return {
                id: topicId,
                name: meta.title || meta.description || "Tópico",
                idLevel: levelId,
                levelName: levelDoc.title || "Avaliado",
                achieved: levelDoc.isPassing !== false,
                value: Number(levelDoc.value || 0),
                order: Number(levelDoc.order ?? levelDoc.value ?? 0)
            }
        }).filter(Boolean)

        if (currentCriteria.length === 0) {
            return { skipped: true, reason: 'no_criteria' }
        }

        // 3. Lógica de Percentual
        const maxLevelValue = levels.reduce((max, l) => Math.max(max, Number(l.value || 0)), 0)

        const calculatePct = (criteriaArr) => {
            if (!criteriaArr || criteriaArr.length === 0 || !allTopicIds?.length || maxLevelValue === 0) return 0
            let sum = 0
            allTopicIds.forEach(tId => {
                const c = criteriaArr.find(item => String(item.id || item.idTopic) === String(tId))
                if (c) {
                    const lvlId = c.idLevel
                    const lvlObj = levels.find(l => String(l.id) === String(lvlId))
                    if (lvlObj) sum += Number(lvlObj.value || 0)
                }
            })
            return Math.round((sum / (allTopicIds.length * maxLevelValue)) * 100)
        }

        const currentPercent = calculatePct(currentCriteria)

        // 4. Identificar avaliações ANTERIORES (exclui a doc atual se já estiver salva no histórico)
        const historyWithoutCurrent = activityEvals.filter(ev => String(ev.idEvent) !== String(activeEventId))
        const lastEval = historyWithoutCurrent[0] // A mais recente antes desta
        const prevEvals = historyWithoutCurrent.slice(0, 3) // Até 3 últimas para o histórico

        // 5. Construir cabeçalho de progresso (Timeline Visual)
        let progressHeader = `🏆 *RELATÓRIO DE EVOLUÇÃO*\n`
        progressHeader += `━━━━━━━━━━━━━━━━━━━━━━\n`

        if (prevEvals.length > 0) {
            // Montar histórico (mais antigas primeiro na leitura de cima pra baixo)
            const historyLines = [...prevEvals].reverse().map((ev, idx) => {
                const pct = calculatePct(ev.criteria)
                const statusIcon = idx === 0 ? '📉' : '📊'
                return `${statusIcon} ${formatDate(ev.date, 'DD/MM/YY')}: ${pct}%`
            })
            progressHeader += `${historyLines.join('\n')}\n`
        }

        progressHeader += `🚀 *HOJE:* ${currentPercent}% de avanço\n`
        progressHeader += `━━━━━━━━━━━━━━━━━━━━━━\n\n`

        // 6. Agrupar critérios por Objetivo e detectar MELHORA (👍)
        const groupedByObjective = currentCriteria.reduce((acc, curr) => {
            const objectiveTitle = topicMetaById[curr.id]?.objectiveTitle || "Geral"
            if (!acc[objectiveTitle]) acc[objectiveTitle] = []

            let improved = false
            let prevLevelName = ""

            if (lastEval && lastEval.criteria) {
                const prevCrit = lastEval.criteria.find(c => String(c.id) === String(curr.id))
                if (prevCrit) {
                    const prevLevel = levels.find(l => String(l.id) === String(prevCrit.idLevel))
                    if (prevLevel) {
                        const prevOrder = Number(prevLevel.order ?? prevLevel.value ?? 0)
                        if (curr.order > prevOrder) {
                            improved = true
                            prevLevelName = prevLevel.title
                        }
                    }
                }
            }

            acc[objectiveTitle].push({ ...curr, improved, prevLevelName })
            return acc
        }, {})

        const resultsDetailed = Object.entries(groupedByObjective).map(([objective, items]) => {
            const itemsText = items.map(c => {
                let topicLine = `🔹 *${c.name}*`

                if (c.improved && c.prevLevelName) {
                    // Estilo de Evolução: Nível Anterior ➔ Nível Atual
                    topicLine += `\n   ${c.prevLevelName} ➔ *${c.levelName}* 👍`
                } else {
                    // Estilo padrão: Nível Atual
                    topicLine += `\n   ⭐ *${c.levelName}*`
                }
                return topicLine
            }).join('\n\n')

            return `📚 *${objective.toUpperCase()}*\n${itemsText}`
        }).join('\n\n──────────────────\n\n')

        const finalResultsText = `${progressHeader}${resultsDetailed}`

        // 7. Enviar via Automação
        await automationService.emit(idTenant, 'EVALUATION_RESULT', {
            studentName: client.name,
            name: client.name,
            phone: client.phone || client.cellPhone || client.responsavelPhone,
            results: finalResultsText,
            date: formatDate(new Date())
        })

        return { success: true }
    }, [idTenant, idBranch, idActivity, allTopicIds, topicMetaById, draftLevelsByTopicId, levels, activeEventId])


    // Envio Individual (Botão ao lado do aluno)
    const sendEvaluationToClient = useCallback(async (client) => {
        if (!idActivity) return

        if (withLoading) {
            await withLoading('sendEvaluation', async () => {
                try {
                    const res = await processEvaluationMessage(client)
                    if (res?.skipped) {
                        toast.warning("Não há critérios avaliados para este aluno.")
                    } else {
                        toast.success(`Mensagem enviada para ${client.name}!`)
                    }
                } catch (e) {
                    console.error("Erro no sendEvaluationToClient:", e)
                    toast.error("Erro ao processar e enviar mensagem.")
                }
            })
        }
    }, [idActivity, withLoading, processEvaluationMessage])

    // Envio em Massa (Send All)
    const sendAllEvaluations = useCallback(async () => {
        const excludedSet = new Set(excludedIds || [])
        const targetClients = clients.filter(c => !excludedSet.has(String(c.id)))

        if (targetClients.length === 0) return

        // Inicializa estado de Loading
        setSendingStatus({ loading: true, step: 'Preparando o envio...', progress: 10, currentClientName: '' })

        try {
            // Simulação de etapas ("preparando", "analisando", etc) para melhor UX
            await new Promise(r => setTimeout(r, 800))

            setSendingStatus(prev => ({ ...prev, step: 'Analisando os objetivos...', progress: 30 }))
            await new Promise(r => setTimeout(r, 800))

            setSendingStatus(prev => ({ ...prev, step: 'Identificando o avanço dos alunos...', progress: 50 }))
            await new Promise(r => setTimeout(r, 800))

            setSendingStatus(prev => ({ ...prev, step: 'Padronizando as mensagens...', progress: 70 }))
            await new Promise(r => setTimeout(r, 800))

            setSendingStatus(prev => ({ ...prev, step: 'Agora enviando...', progress: 80 }))

            // Loop de envio real
            let sentCount = 0
            const total = targetClients.length

            for (let i = 0; i < total; i++) {
                const client = targetClients[i]
                setSendingStatus(prev => ({
                    ...prev,
                    step: `Enviando para ${client.name}...`,
                    progress: 80 + Math.floor((i / total) * 15), // 80% a 95%
                    currentClientName: client.name
                }))

                try {
                    await processEvaluationMessage(client)
                    sentCount++
                } catch (e) {
                    console.error(`Erro ao enviar para ${client.name}`, e)
                }
            }

            setSendingStatus(prev => ({ ...prev, step: 'Status: Enviado!', progress: 100, currentClientName: '' }))
            toast.success(`${sentCount} mensagens enviadas com sucesso!`)

        } catch (error) {
            console.error(error)
            toast.error("Erro ao enviar mensagens em massa.")
        } finally {
            // Fecha o modal após 2 segundos
            setTimeout(() => {
                setSendingStatus(prev => ({ ...prev, loading: false, step: '', progress: 0 }))
            }, 2000)
        }
    }, [clients, excludedIds, processEvaluationMessage])


    return { saveAll, sendEvaluationToClient, sendAllEvaluations, sendingStatus }
}
