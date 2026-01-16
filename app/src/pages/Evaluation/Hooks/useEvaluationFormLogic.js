import { useState, useMemo, useEffect } from "react"
import { listEvaluationLevels } from "../../../services/EvaluationLevels"
import { getActiveEvaluationEvent } from "../../../services/Events/events.service"
import { useLoading } from "../../../hooks/useLoading"
import { useActiveClientsPool } from "../../../hooks/evaluation/useActiveClientsPool"
import { useClassClients } from "../../../hooks/evaluation/useClassClients"

export const useEvaluationFormLogic = ({ classId }) => {
    const { isLoading, withLoading } = useLoading()
    const [extraClients, setExtraClients] = useState([])
    const [searchText, setSearchText] = useState("")
    const [excludedClientIds, setExcludedClientIds] = useState(() => new Set())
    const [levels, setLevels] = useState([])
    const [activeEvent, setActiveEvent] = useState(null)

    const { clients: classClients } = useClassClients({ classId, withLoading })
    const { clients: activeClientsPool } = useActiveClientsPool({ enabled: true })

    const allClients = useMemo(() => {
        const base = Array.isArray(classClients) ? classClients : []
        const extra = Array.isArray(extraClients) ? extraClients : []
        const map = new Map()
        base.forEach(s => {
            if (s?.id == null) return
            map.set(String(s.id), s)
        })
        extra.forEach(s => {
            if (s?.id == null) return
            const key = String(s.id)
            if (!map.has(key)) map.set(key, s)
        })
        return Array.from(map.values())
    }, [classClients, extraClients])

    const evaluationClients = useMemo(() => {
        const base = Array.isArray(allClients) ? allClients : []
        if (!excludedClientIds || excludedClientIds.size === 0) return base
        return base.filter(s => !excludedClientIds.has(String(s.id)))
    }, [allClients, excludedClientIds])

    const addCandidates = useMemo(() => {
        const q = (searchText || "").trim().toLowerCase()
        if (!q) return []
        const existingIds = new Set((allClients || []).map(s => String(s.id)))
        const base = Array.isArray(activeClientsPool) ? activeClientsPool : []
        return base
            .filter(s => !existingIds.has(String(s.id)))
            .filter(s => {
                const name = (s.name || "").toLowerCase()
                const gym = (s.idGym || "").toLowerCase()
                return name.includes(q) || gym.includes(q)
            })
            .slice(0, 8)
    }, [activeClientsPool, allClients, searchText])

    const showNoAutocompleteResults = useMemo(() => {
        const q = (searchText || "").trim()
        if (!q) return false
        return addCandidates.length === 0
    }, [searchText, addCandidates.length])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                await withLoading("levels", async () => {
                    const data = await listEvaluationLevels()
                    if (!cancelled) setLevels(Array.isArray(data) ? data : [])
                })
            } catch (e) {
                console.error("Erro ao carregar níveis", e)
                if (!cancelled) setLevels([])
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [withLoading])

    const defaultLevelId = useMemo(() => {
        const first = Array.isArray(levels) && levels.length > 0 ? levels[0] : null
        return first?.id != null ? String(first.id) : ""
    }, [levels])

    useEffect(() => {
        const checkEvent = async () => {
            try {
                await withLoading('checkEvent', async () => {
                    const evt = await getActiveEvaluationEvent()
                    setActiveEvent(evt)
                })
            } catch (e) {
                console.error("Erro ao verificar evento ativo", e)
            }
        }
        checkEvent()
    }, [withLoading])

    const toggleExcludeClient = (idClient) => {
        const key = String(idClient)
        setExcludedClientIds(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const handleAddClient = (client) => {
        const sId = String(client.id)
        setExtraClients(prev => {
            const next = Array.isArray(prev) ? prev.slice() : []
            if (!next.some(x => String(x.id) === sId)) next.push(client)
            return next
        })
        setExcludedClientIds(prev => {
            const next = new Set(prev)
            next.delete(sId)
            return next
        })
        setSearchText("")
    }

    return {
        isLoading,
        withLoading,
        searchText,
        setSearchText,
        levels,
        activeEvent,
        allClients,
        evaluationClients,
        addCandidates,
        showNoAutocompleteResults,
        defaultLevelId,
        toggleExcludeClient,
        handleAddClient,
        excludedClientIds,
        classClients // exported if needed for initial check
    }
}
