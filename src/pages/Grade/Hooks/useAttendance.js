import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import { useLoading } from "../../../hooks/useLoading"
import { useTenant } from "../../../hooks/useTenant"
import { AttendanceService } from "../../../services/Classes/AttendanceService"
import { ClientService } from "../../../services/Clients/ClientService"

/**
 * Hook para gerenciar o modal de controle de presença
 * 
 * Fluxo:
 * 1. Ao abrir o modal, carrega alunos matriculados OU snapshot existente
 * 2. Permite adicionar alunos extras via busca
 * 3. Permite marcar presença/ausência
 * 4. Ao salvar, chama AttendanceService.recordAttendance()
 */
export const useAttendance = (isOpen, schedule, onAttendanceSaved, onEnrollmentChange) => {
    const { idTenant, idBranch, user, isReady } = useTenant()
    const [clients, setClients] = useState([])
    const [searchText, setSearchText] = useState("")
    const [allClients, setAllClients] = useState([])
    const { isLoading, withLoading } = useLoading()
    const [justAddedId, setJustAddedId] = useState(null)
    const [isDirty, setIsDirty] = useState(false)

    // Carregar dados ao abrir o modal
    useEffect(() => {
        const loadData = async () => {
            if (!isOpen || !schedule?.id || !isReady) return

            try {
                await withLoading('load', async () => {
                    // 1. Carregar lista de clientes para busca
                    const clientsList = await ClientService.listClients(idTenant, idBranch)
                    setAllClients(clientsList)

                    // 2. Carregar alunos ATUALMENTE matriculados na turma E na sessão (Experimentais)
                    // Buscar matrículas da TURMA (Recorrentes) e da SESSÃO (Experimentais/Reposições)
                    const [classEnrollments, sessionEnrollments] = await Promise.all([
                        schedule.idClass ? AttendanceService.getStudentsForAttendance(idTenant, idBranch, schedule.idClass) : [],
                        import('../../../data/repositories/EnrollmentRepository').then(m =>
                            m.enrollmentRepository.listSessionEnrolledClients(idTenant, idBranch, schedule.id)
                        )
                    ])

                    // Mapear experimentais para o formato de attendance
                    const mappedSessionEnrollments = (sessionEnrollments || []).map(e => ({
                        id: e.idClient,
                        idClient: e.idClient,
                        enrollmentId: e.enrollmentId || e.id,
                        name: e.clientName,
                        photo: e.clientPhoto || null,
                        status: 'present',
                        justification: '',
                        tag: e.enrollmentType === 'trial' ? 'EX' : (e.tag || 'Sessão'),
                        enrollmentType: e.enrollmentType || 'single-session',
                        attendedSessions: 0,
                        missedSessions: 0
                    }))

                    // Criar mapa de matrículas ativas da TURMA: enrollmentId -> student
                    const activeEnrollmentsMap = new Map()
                    classEnrollments.forEach(student => {
                        if (student.enrollmentId) {
                            activeEnrollmentsMap.set(student.enrollmentId, student)
                        }
                    })

                    // 3. Verificar se já existe chamada registrada
                    const existingAttendance = await AttendanceService.getSessionAttendance(
                        idTenant, idBranch, schedule.id
                    )

                    if (existingAttendance) {
                        // EDIÇÃO: Filtrar snapshot para remover matrículas canceladas de TURMA recorrente
                        const validatedClients = existingAttendance.clients.filter(client => {
                            // Alunos extras (sem enrollmentId) ou Experimentais (da sessão) são mantidos
                            // Se for da sessão (experimental), não validar contra map de turma
                            if (!client.enrollmentId || client.tag === 'EX' || client.enrollmentType === 'trial') return true

                            // Verificar se a matrícula de TURMA ainda está ativa
                            return activeEnrollmentsMap.has(client.enrollmentId)
                        })

                        // Verificar se há NOVOS alunos experimentais que não estavam no snapshot
                        const existingClientIds = new Set(validatedClients.map(c => c.idClient || String(c.id)))
                        const newSessionEnrollments = mappedSessionEnrollments.filter(se => !existingClientIds.has(se.idClient))

                        // Enriquecer com dados atuais e Adicionar novos experimentais
                        const enrichedClients = validatedClients.map(client => {
                            const clientInfo = clientsList.find(c => c.id === client.idClient) || {}
                            return {
                                ...client,
                                name: clientInfo.name || client.name,
                                photo: clientInfo.photoUrl || client.photo,
                                clientStatus: clientInfo.lifecycleStatus || 'active',
                                friendlyId: clientInfo.friendlyId || client.friendlyId
                            }
                        })

                        // Enriquecer novos alunos de sessão também
                        const enrichedNewSessionEnrollments = newSessionEnrollments.map(student => {
                            const clientInfo = clientsList.find(c => c.id === student.idClient) || {}
                            return {
                                ...student,
                                name: clientInfo.name || student.name,
                                photo: clientInfo.photoUrl || student.photo, // Prioritize client list photo
                                clientStatus: clientInfo.lifecycleStatus || 'active',
                                friendlyId: clientInfo.friendlyId
                            }
                        })

                        // Adicionar novos alunos de sessão (ex: agendou experimental depois de salvar chamada)
                        const finalClients = [...enrichedClients, ...enrichedNewSessionEnrollments]

                        setClients(finalClients)

                    } else {
                        // NOVA CHAMADA
                        // Merge unificando por idClient
                        const enrolledMap = new Map()

                        // 1. Matrículas da turma
                        classEnrollments.forEach(c => enrolledMap.set(String(c.idClient), c))

                        // 2. Matrículas da sessão (sobrescreve/adiciona)
                        mappedSessionEnrollments.forEach(c => {
                            enrolledMap.set(String(c.idClient), c)
                        })

                        const mergedList = Array.from(enrolledMap.values())

                        const enrichedClients = mergedList.map(student => {
                            const clientInfo = clientsList.find(c => c.id === student.idClient) || {}
                            return {
                                ...student,
                                name: clientInfo.name || student.name,
                                photo: clientInfo.photoUrl || null,
                                clientStatus: clientInfo.lifecycleStatus || 'active',
                                friendlyId: clientInfo.friendlyId
                            }
                        })

                        setClients(enrichedClients)

                    }
                })
            } catch (error) {
                console.error("[useAttendance] Erro ao carregar dados:", error)
                toast.error("Erro ao carregar dados de presença")
            }
        }

        loadData()
    }, [isOpen, schedule, idTenant, idBranch, isReady, withLoading])

    // Busca de clientes (filtro em memória)
    const searchResults = useMemo(() => {
        if (!searchText.trim()) return []
        const search = searchText.toLowerCase()
        return allClients.filter(c =>
            c.name?.toLowerCase().includes(search) ||
            c.friendlyId?.toLowerCase().includes(search) ||
            c.cpf?.includes(search)
        ).slice(0, 5)
    }, [searchText, allClients])

    // Limpar animação de destaque
    useEffect(() => {
        if (!justAddedId) return
        const t = setTimeout(() => setJustAddedId(null), 900)
        return () => clearTimeout(t)
    }, [justAddedId])

    // Adicionar aluno extra (não matriculado formalmente)
    const handleSelectSearchClient = useCallback((client) => {
        if (!client?.id) return
        const idClient = client.idClient || String(client.id)

        // Validação de status
        if (client.lifecycleStatus === 'suspended') {
            toast.error("Este aluno está SUSPENSO e não pode realizar check-in.")
            return
        }

        if (client.lifecycleStatus === 'inactive' || client.lifecycleStatus === 'lost') {
            toast.warning(`Atenção: Aluno com status '${client.lifecycleStatus}'.`)
        }

        setSearchText("")

        setClients(prev => {
            if (prev.some(s => String(s.idClient) === idClient)) {
                toast.info("Este aluno já está na lista")
                return prev
            }

            // NOTA: Alunos extras NÃO têm enrollmentId (não afetam contadores de matrícula)
            const newClient = {
                id: idClient,
                idClient: idClient,
                enrollmentId: null, // Sem matrícula formal
                name: client.name,
                photo: client.photoUrl || null,
                status: "present",
                justification: "",
                tag: "Extra", // Indica que não é matriculado
                friendlyId: client.friendlyId,
                clientStatus: client.lifecycleStatus
            }

            setJustAddedId(idClient)
            setIsDirty(true)
            onEnrollmentChange?.({ id: schedule.id, action: 'add' })
            return [newClient, ...prev]
        })
    }, [schedule, onEnrollmentChange])

    // Marcar início de edição de ausência
    const handleMarkAbsence = useCallback((id) => {
        setClients(prev =>
            prev.map(s => (s.id === id ? { ...s, status: "editing", justification: "" } : s))
        )
        setIsDirty(true)
    }, [])

    // Confirmar ausência
    const handleConfirmAbsence = useCallback((id) => {
        setClients(prev => prev.map(s => (s.id === id ? { ...s, status: "absent" } : s)))
        setIsDirty(true)
    }, [])

    // Marcar presente
    const handleMarkPresent = useCallback((id) => {
        setClients(prev => prev.map(s => (s.id === id ? { ...s, status: "present", justification: "" } : s)))
        setIsDirty(true)
    }, [])

    // Alterar justificativa
    const handleChangeJustification = useCallback((id, text) => {
        setClients(prev => prev.map(s => (s.id === id ? { ...s, justification: text } : s)))
        setIsDirty(true)
    }, [])

    // Salvar chamada
    const handleSave = async (onClose) => {
        if (!schedule?.id || !isReady) return

        try {
            await withLoading('save', async () => {
                const result = await AttendanceService.recordAttendance(
                    idTenant,
                    idBranch,
                    user,
                    schedule.id,
                    { clients }
                )


                toast.success(`Presenças salvas! ${result.presentCount} presentes, ${result.absentCount} ausentes`)

                onAttendanceSaved?.({
                    idSession: schedule.id,
                    presentCount: result.presentCount,
                    absentCount: result.absentCount
                })

                setIsDirty(false)
                onClose()
            })
        } catch (error) {
            console.error("[useAttendance] Erro ao salvar:", error)
            toast.error(error.message || "Erro ao salvar presenças")
        }
    }

    // Estatísticas em tempo real
    const attendanceStats = useMemo(() => ({
        present: clients.filter(s => s.status !== "absent").length,
        absent: clients.filter(s => s.status === "absent").length,
        total: clients.length,
        withEnrollment: clients.filter(s => s.enrollmentId).length
    }), [clients])

    return {
        clients,
        searchText,
        setSearchText,
        searchResults,
        isLoading,
        isDirty,
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
