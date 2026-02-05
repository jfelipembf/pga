import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTenant } from '../../../../hooks/useTenant'
import { EvaluationService } from '../../../../services/Evaluations/EvaluationService'
import { activityRepository } from '../../../../data/repositories/ActivityRepository'
import { evaluationLevelRepository } from '../../../../data/repositories/EvaluationLevelRepository'
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
                const evals = await EvaluationService.getStudentEvaluations(idTenant, idBranch, id)
                const last5 = evals.slice(0, 5)
                setEvaluations(last5)

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

        // Datas únicas para as colunas
        const dates = evaluations.map(e => e.date).sort((a, b) => moment(b).diff(moment(a)))

        // Agrupar avaliações por atividade
        const activityGroups = {}
        evaluations.forEach(ev => {
            if (!activityGroups[ev.idActivity]) activityGroups[ev.idActivity] = []
            activityGroups[ev.idActivity].push(ev)
        })

        const matrix = Object.keys(activityGroups).map(actId => {
            const activity = activities.find(a => String(a.id) === String(actId))
            if (!activity) return null

            const sortedObjectives = Object.values(activity.objectives || {})
                .sort((a, b) => (a.order || 0) - (b.order || 0))

            const objectiveRows = sortedObjectives.map(obj => {
                const sortedTopics = Object.values(obj.topics || {})
                    .sort((a, b) => (a.order || 0) - (b.order || 0))

                const topicRows = sortedTopics.map(topic => {
                    const valuesByDate = dates.map(date => {
                        const evalAtDate = activityGroups[actId].find(e => e.date === date)
                        if (!evalAtDate || !evalAtDate.criteria) return null

                        const criterion = evalAtDate.criteria.find(c => String(c.id) === String(topic.id))
                        if (!criterion) return null

                        // Resolve level name
                        const realLevel = levels.find(l => String(l.id) === String(criterion.idLevel))
                        return realLevel ? realLevel.name : (criterion.levelName || "Avaliado")
                    })

                    return {
                        id: topic.id,
                        title: topic.description,
                        isTopic: true,
                        values: valuesByDate
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

            return {
                id: activity.id,
                activityName: activity.name,
                objectives: objectiveRows,
                dates: dates.map(d => moment(d).format('DD/MM/YY'))
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
