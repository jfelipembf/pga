import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTenant } from '../../../../../hooks/useTenant'
import { EvaluationService } from '../../../../../services/Evaluations/EvaluationService'
import { activityRepository } from '../../../../../data/repositories/ActivityRepository'
import { evaluationLevelRepository } from '../../../../../data/repositories/EvaluationLevelRepository'
import moment from 'moment'

export const useClientEvaluations = () => {
    const { id } = useParams()
    const { idTenant, idBranch } = useTenant()
    const [loading, setLoading] = useState(true)
    const [evaluations, setEvaluations] = useState([])
    const [activities, setActivities] = useState([])
    const [levels, setLevels] = useState([])

    useEffect(() => {
        if (!idTenant || !idBranch || !id) return

        const loadData = async () => {
            setLoading(true)
            try {
                // 1. Buscar as últimas avaliações do aluno (ordenadas por data desc)
                const evals = await EvaluationService.getClientEvaluations(idTenant, idBranch, id)
                setEvaluations(evals || [])

                // 2. Buscar todas as atividades para montar a estrutura de Objetivos/Tópicos
                const allActivities = await activityRepository.findAllWithObjectives(idTenant, idBranch)
                setActivities(allActivities)

                // 3. Buscar os níveis de avaliação para resolver nomes corretamente
                const allLevels = await evaluationLevelRepository.findAll(idTenant, idBranch)
                setLevels(allLevels)

            } catch (error) {
                console.error("Erro ao carregar avaliações do cliente:", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [idTenant, idBranch, id])

    const evaluationMatrix = useMemo(() => {
        if (!evaluations.length || !activities.length) return []

        const maxLevelValue = levels.reduce((max, l) => Math.max(max, Number(l.value || 0)), 0)

        const activityGroups = {}
        evaluations.forEach(ev => {
            if (!activityGroups[ev.idActivity]) activityGroups[ev.idActivity] = []
            activityGroups[ev.idActivity].push(ev)
        })

        const matrix = Object.keys(activityGroups).map(actId => {
            const activity = activities.find(a => String(a.id) === String(actId))
            if (!activity) return null

            const groupedRecent = activityGroups[actId]
                .sort((a, b) => {
                    const diff = moment(b.date).diff(moment(a.date))
                    if (diff !== 0) return diff
                    return String(b.id || "").localeCompare(String(a.id || ""))
                })
                .slice(0, 3)
                .reverse()

            const sortedObjectives = Object.values(activity.objectives || {})
                .sort((a, b) => (a.order || 0) - (b.order || 0))

            const objectiveRows = sortedObjectives.map(obj => {
                const sortedTopics = Object.values(obj.topics || {})
                    .sort((a, b) => (a.order || 0) - (b.order || 0))

                const topicRows = sortedTopics.map(topic => {
                    const values = groupedRecent.map((evalDoc, idx) => {
                        if (!evalDoc || !evalDoc.criteria) return null

                        const criterion = evalDoc.criteria.find(c => String(c.id) === String(topic.id))
                        if (!criterion) return null

                        const realLevel = levels.find(l => String(l.id) === String(criterion.idLevel))
                        const title = realLevel ? realLevel.title : (criterion.levelName || "Avaliado")

                        const getLevelColor = (val) => {
                            const v = Number(val);
                            if (v === 0) return "secondary";
                            if (maxLevelValue === 0) return "info";

                            const percent = (v / maxLevelValue) * 100;
                            if (percent >= 90) return "success";
                            if (percent >= 60) return "primary";
                            if (percent >= 30) return "info";
                            if (percent >= 10) return "warning";
                            return "secondary";
                        }
                        const color = realLevel ? getLevelColor(realLevel.value) : "info"

                        let improved = false;
                        const prevEval = groupedRecent[idx - 1];
                        if (prevEval && prevEval.criteria && realLevel) {
                            const prevCrit = prevEval.criteria.find(c => String(c.id) === String(topic.id));
                            if (prevCrit) {
                                const prevLevel = levels.find(l => String(l.id) === String(prevCrit.idLevel));
                                if (prevLevel) {
                                    const currentOrder = Number(realLevel.order ?? realLevel.value ?? 0);
                                    const prevOrder = Number(prevLevel.order ?? prevLevel.value ?? 0);
                                    if (currentOrder > prevOrder) improved = true;
                                }
                            }
                        }

                        return { title, improved, color }
                    })

                    return {
                        id: topic.id,
                        title: topic.description,
                        isTopic: true,
                        values
                    }
                })

                return {
                    id: obj.id,
                    title: obj.title,
                    isObjective: true,
                    topics: topicRows,
                    order: obj.order
                }
            })

            const allActivityTopics = sortedObjectives.flatMap(obj => Object.values(obj.topics || {}))
            const totalTopics = allActivityTopics.length

            let currentTotalValue = 0
            if (totalTopics > 0 && maxLevelValue > 0) {
                const evaluationsSorted = [...activityGroups[actId]].sort((a, b) => {
                    const dDiff = moment(b.date).diff(moment(a.date))
                    if (dDiff !== 0) return dDiff
                    return String(b.id || "").localeCompare(String(a.id || ""))
                })

                allActivityTopics.forEach(topic => {
                    let latestLevelValue = 0
                    for (const ev of evaluationsSorted) {
                        const crit = ev.criteria?.find(c => String(c.id) === String(topic.id))
                        if (crit && crit.idLevel) {
                            const lvl = levels.find(l => String(l.id) === String(crit.idLevel))
                            if (lvl) {
                                latestLevelValue = Number(lvl.value || 0)
                                break
                            }
                        }
                    }
                    currentTotalValue += latestLevelValue
                })
            }

            const advancePercentage = totalTopics > 0 && maxLevelValue > 0
                ? Math.round((currentTotalValue / (totalTopics * maxLevelValue)) * 100)
                : 0

            return {
                id: activity.id,
                activityName: activity.name,
                objectives: objectiveRows,
                dates: groupedRecent.map(d => moment(d.date).format('DD/MM/YY')),
                advancePercentage
            }
        }).filter(Boolean)

        return matrix
    }, [evaluations, activities, levels])

    return {
        loading,
        evaluationMatrix,
        hasEvaluations: evaluations.length > 0
    }
}
