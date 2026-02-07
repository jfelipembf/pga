import { useState, useMemo, useEffect } from "react"
import { useTenant } from "../../../hooks/useTenant"
import { useLoading } from "../../../hooks/useLoading"
import { EvaluationLevelService } from "../../../services/Admin/EvaluationLevelService"
import { useActiveClientsPool } from "./useActiveClientsPool"
import { useClassClients } from "./useClassClients"
import { EventService } from "../../../services/Events/EventService"

export const useEvaluationFormLogic = ({ classId }) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { isLoading, anyLoading, withLoading } = useLoading()
    const [extraClients, setExtraClients] = useState([])
    const [searchText, setSearchText] = useState("")
    const [excludedClientIds, setExcludedClientIds] = useState(() => new Set())
    const [levels, setLevels] = useState([])
    const [activeEvent, setActiveEvent] = useState(null) // Cliclo de Avaliação Técnica
    const [activeTestEvent, setActiveTestEvent] = useState(null) // Ciclo de Testes

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
                // const gym = (s.idGym || "").toLowerCase() // Assuming idGym might not be present in simplified obj
                return name.includes(q)
            })
            .slice(0, 8)
    }, [activeClientsPool, allClients, searchText])

    const showNoAutocompleteResults = useMemo(() => {
        const q = (searchText || "").trim()
        if (!q) return false
        return addCandidates.length === 0
    }, [searchText, addCandidates.length])

    useEffect(() => {
        if (!isReady) return

        let cancelled = false
        const load = async () => {
            try {
                await withLoading("levels", async () => {
                    const data = await EvaluationLevelService.listAll(idTenant, idBranch)
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
    }, [isReady, idTenant, idBranch, withLoading])

    const defaultLevelId = useMemo(() => {
        const first = Array.isArray(levels) && levels.length > 0 ? levels[0] : null
        return first?.id != null ? String(first.id) : ""
    }, [levels])

    useEffect(() => {
        if (!idTenant || !idBranch) return

        const checkEvent = async () => {
            try {
                await withLoading('checkEvent', async () => {
                    const [evalEvt, testEvt] = await Promise.all([
                        EventService.getActiveEvent(idTenant, idBranch, 'evaluation'),
                        EventService.getActiveEvent(idTenant, idBranch, 'test')
                    ])
                    setActiveEvent(evalEvt || null)
                    setActiveTestEvent(testEvt || null)
                })
            } catch (e) {
                console.error("Erro ao verificar evento ativo", e)
            }
        }
        checkEvent()
    }, [idTenant, idBranch, withLoading])

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
        anyLoading,
        withLoading,
        searchText,
        setSearchText,
        levels,
        activeEvent,
        activeTestEvent,
        allClients,
        evaluationClients,
        addCandidates,
        showNoAutocompleteResults,
        defaultLevelId,
        toggleExcludeClient,
        handleAddClient,
        excludedClientIds,
        classClients
    }
}
