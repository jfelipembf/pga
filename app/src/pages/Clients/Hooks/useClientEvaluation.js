import { useState, useEffect, useMemo } from "react"
import { normalizeEvaluations, buildEvaluationObjectives } from "../Utils/evaluationUtils"
import clientsEvaluationService from "../../../services/ClientsEvaluation"

export const useClientEvaluation = (clientId) => {
    const [showHistory, setShowHistory] = useState(false)
    const [evaluations, setEvaluations] = useState([])
    const [loading, setLoading] = useState(false)

    // Carregar avaliações do cliente no novo formato
    useEffect(() => {
        if (!clientId) return

        const loadEvaluations = async () => {
            try {
                setLoading(true)
                // Buscar todas as avaliações do cliente
                const data = await clientsEvaluationService.getClientEvaluations({ idClient: clientId })
                setEvaluations(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error("Erro ao carregar avaliações:", error)
                setEvaluations([])
            } finally {
                setLoading(false)
            }
        }

        loadEvaluations()
    }, [clientId])

    const normalized = useMemo(() => normalizeEvaluations(evaluations), [evaluations])

    // Mostrar as últimas 5 avaliações como colunas.
    // Como o service retorna DESC, exibimos invertendo para que a mais recente fique à direita.
    const visibleEvaluations = useMemo(() => {
        const latest = (normalized || []).slice(0, 5)
        return latest // Newest first (Left)
    }, [normalized])

    // construir árvore de objetivos -> tópicos
    const objectives = useMemo(() => buildEvaluationObjectives(visibleEvaluations), [visibleEvaluations])

    // Carregar configurações de níveis
    const [levelsConfig, setLevelsConfig] = useState([])

    useEffect(() => {
        let mounted = true
        const loadLevels = async () => {
            try {
                const { listEvaluationLevels } = require("../../../services/EvaluationLevels/evaluationLevels.service")
                const data = await listEvaluationLevels()
                if (mounted) setLevelsConfig(Array.isArray(data) ? data : [])
            } catch (e) {
                console.error("Erro ao carregar níveis", e)
            }
        }
        loadLevels()
        return () => { mounted = false }
    }, [])

    return {
        showHistory,
        setShowHistory,
        loading,
        visibleEvaluations,
        objectives,
        evaluations,
        levelsConfig // Exposed
    }
}
