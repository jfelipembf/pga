import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import { useLoading } from "../../../hooks/useLoading"
import { useTenant } from "../../../hooks/useTenant"
import { SessionService } from "../../../services/Admin/SessionService"
import { ClientService } from "../../../features/clients/services/ClientService"

export const useAttendance = (isOpen, schedule, onAttendanceSaved, onEnrollmentChange) => {
    const { idTenant, idBranch, user, isReady } = useTenant()
    const [clients, setClients] = useState([])
    const [searchText, setSearchText] = useState("")
    const [allClients, setAllClients] = useState([])
    const { isLoading, withLoading } = useLoading()
    const [justAddedId, setJustAddedId] = useState(null)

    // Load attendance and all clients for search
    useEffect(() => {
        const loadData = async () => {
            if (!isOpen || !schedule?.id || !isReady) return

            try {
                await withLoading('load', async () => {
                    // Fetch all active clients for the search dropdown
                    const clientsList = await ClientService.listClients(idTenant, idBranch)
                    setAllClients(clientsList)

                    // Check if attendance is already recorded in the session
                    if (schedule.attendanceRecorded && schedule.attendanceSnapshot) {
                        setClients(schedule.attendanceSnapshot)
                    } else {
                        // In the future, load enrolled students for this class
                        setClients([])
                    }
                })
            } catch (error) {
                console.error("Error loading attendance data:", error)
                toast.error("Erro ao carregar dados de presença")
            }
        }

        loadData()
    }, [isOpen, schedule, idTenant, idBranch, isReady, withLoading])

    // Search clients logic (in-memory search from allClients)
    const searchResults = useMemo(() => {
        if (!searchText.trim()) return []
        const search = searchText.toLowerCase()
        return allClients.filter(c =>
            c.name?.toLowerCase().includes(search) ||
            c.friendlyId?.toLowerCase().includes(search) ||
            c.cpf?.includes(search)
        ).slice(0, 5) // Limit to top 5 results
    }, [searchText, allClients])

    // Clear animation state
    useEffect(() => {
        if (!justAddedId) return
        const t = setTimeout(() => setJustAddedId(null), 900)
        return () => clearTimeout(t)
    }, [justAddedId])

    const handleSelectSearchClient = useCallback((client) => {
        if (!client?.id) return
        const idClient = client.idClient || String(client.id)

        setSearchText("")

        setClients(prev => {
            if (prev.some(s => String(s.idClient) === idClient)) {
                toast.info("Este aluno já está na lista")
                return prev
            }

            const newClient = {
                id: idClient,
                idClient: idClient,
                name: client.name,
                tag: client.lifecycleStatus?.toUpperCase().substring(0, 2) || "CL",
                photo: client.photoUrl || null,
                status: "present",
                justification: "",
                present: true,
                friendlyId: client.friendlyId
            }

            setJustAddedId(idClient)
            onEnrollmentChange?.({ id: schedule.id, action: 'add' })
            return [newClient, ...prev]
        })
    }, [schedule, onEnrollmentChange])

    const handleMarkAbsence = useCallback((id) => {
        setClients(prev =>
            prev.map(s => (s.id === id ? { ...s, status: "editing", justification: "" } : s))
        )
    }, [])

    const handleConfirmAbsence = useCallback((id) => {
        setClients(prev => prev.map(s => (s.id === id ? { ...s, status: "absent" } : s)))
        toast.success("Ausência registrada!")
    }, [])

    const handleMarkPresent = useCallback((id) => {
        setClients(prev => prev.map(s => (s.id === id ? { ...s, status: "present", justification: "" } : s)))
        toast.success("Presença confirmada!")
    }, [])

    const handleChangeJustification = useCallback((id, text) => {
        setClients(prev => prev.map(s => (s.id === id ? { ...s, justification: text } : s)))
    }, [])

    const handleSave = async (onClose) => {
        if (!schedule?.id || !isReady) return
        try {
            await withLoading('save', async () => {
                const presentList = clients.filter(s => s.status !== "absent")
                const absentList = clients.filter(s => s.status === "absent")

                const attendanceData = {
                    idSession: schedule.id,
                    clients: clients,
                    presentCount: presentList.length,
                    absentCount: absentList.length,
                    userName: user?.displayName || user?.email // For audit log
                }

                await SessionService.saveAttendance(idTenant, idBranch, user.uid, schedule.id, attendanceData)

                toast.success(`Presenças salvas com sucesso!`)
                onAttendanceSaved?.(attendanceData)
                onClose()
            })
        } catch (error) {
            console.error("Error saving attendance:", error)
            toast.error("Erro ao salvar presenças")
        }
    }

    const attendanceStats = useMemo(() => ({
        present: clients.filter(s => s.status !== "absent").length,
        absent: clients.filter(s => s.status === "absent").length,
        total: clients.length
    }), [clients])

    return {
        clients,
        searchText,
        setSearchText,
        searchResults,
        isLoading,
        justAddedId,
        attendanceStats,
        handleSelectSearchClient,
        handleMarkAbsence,
        handleConfirmAbsence,
        handleMarkPresent,
        handleChangeJustification,
        handleSave
    }
}
