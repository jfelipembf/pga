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
    const [searchResults, setSearchResults] = useState([])
    const { isLoading, withLoading } = useLoading()
    const [justAddedId, setJustAddedId] = useState(null)
    const [isDirty, setIsDirty] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    // Carregar dados ao abrir o modal
    useEffect(() => {
        const loadData = async () => {
            if (!isOpen || !schedule?.id || !isReady) return

            try {
                await withLoading('load', async () => {
                    // 1. Carregar alunos que estavam ativos na data da sessão
                    const [classEnrollments, sessionEnrollments] = await Promise.all([
                        schedule.idClass ? AttendanceService.getclientsForAttendance(idTenant, idBranch, schedule.idClass, schedule.sessionDate) : [],
                        import('../../../data/repositories/EnrollmentRepository').then(m =>
                            m.enrollmentRepository.listSessionEnrolledClients(idTenant, idBranch, schedule.id)
                        )
                    ])

                    // Mapear inscrições de sessão (experimental/extra) para o formato de attendance
                    const mappedSessionEnrollments = (sessionEnrollments || []).map(e => ({
                        id: e.idClient,
                        idClient: e.idClient,
                        enrollmentId: e.enrollmentId || e.id,
                        name: e.clientName || 'Aluno',
                        photo: e.clientPhoto || null,
                        status: 'present',
                        justification: '',
                        tag: e.enrollmentType === 'trial' ? 'EX' : (e.tag || 'Sessão'),
                        enrollmentType: e.enrollmentType || 'single-session',
                        clientStatus: 'active'
                    }))

                    // Criar mapa de matrículas ativas da TURMA: enrollmentId -> client
                    const activeEnrollmentsMap = new Map()
                    classEnrollments.forEach(client => {
                        if (client.enrollmentId) {
                            activeEnrollmentsMap.set(client.enrollmentId, client)
                        }
                    })

                    // 3. Verificar se já existe chamada registrada
                    const existingAttendance = await AttendanceService.getSessionAttendance(
                        idTenant, idBranch, schedule.id
                    )

                    if (existingAttendance) {
                        // EDIÇÃO: Filtrar snapshot para remover matrículas canceladas de TURMA recorrente
                        const validatedClients = existingAttendance.clients.map(client => {
                            // PRIORIDADE 1: Se o aluno está no mapa de matrículas ATIVAS da turma, pegamos os dados vivos (Reidratação)
                            if (client.enrollmentId && activeEnrollmentsMap.has(client.enrollmentId)) {
                                const freshEnrollment = activeEnrollmentsMap.get(client.enrollmentId);
                                return {
                                    ...client,
                                    name: freshEnrollment.name,
                                    photo: freshEnrollment.photo,
                                    clientStatus: freshEnrollment.clientStatus,
                                    tag: client.tag || 'Matriculado'
                                }
                            }

                            // PRIORIDADE 2: Se for um aluno experimental da sessão que NÃO está na turma
                            const sessionEnrollment = mappedSessionEnrollments.find(se => se.idClient === client.idClient);
                            if (sessionEnrollment) {
                                return {
                                    ...client,
                                    name: sessionEnrollment.name,
                                    photo: sessionEnrollment.photo,
                                    clientStatus: 'active'
                                }
                            }

                            // PRIORIDADE 3: Manter como está (caso seja um aluno extra buscado manualmente)
                            return client;
                        })

                        // Verificar se há NOVOS alunos experimentais que não estavam no snapshot
                        const existingClientIds = new Set(validatedClients.map(c => c.idClient || String(c.id)))
                        const newSessionEnrollments = mappedSessionEnrollments.filter(se => !existingClientIds.has(se.idClient))

                        // Simplificando: Não buscamos fotos/status de todos para economizar leituras
                        const finalClients = [...validatedClients, ...newSessionEnrollments]
                        setClients(finalClients)

                    } else {
                        // NOVA CHAMADA
                        const enrolledMap = new Map()
                        // 1. Adicionamos a Fonte de Verdade (Matrículas da Turma com Status atualizado)
                        classEnrollments.forEach(c => enrolledMap.set(String(c.idClient), c))

                        // 2. Mesclamos com as inscrições da sessão. 
                        mappedSessionEnrollments.forEach(c => {
                            const stringId = String(c.idClient)
                            if (enrolledMap.has(stringId)) {
                                // Se o aluno já veio da fonte mãe, NÃO sobrescrevemos o objeto inteiro, pois
                                // o 'mappedSessionEnrollments' tem informações mais capadas da subcoleção e força 'active'
                                const existing = enrolledMap.get(stringId)
                                // Apenas atualizamos coisas que a sessão talvez tenha de específico, preservando o clientStatus
                                enrolledMap.set(stringId, {
                                    ...existing,
                                    tag: c.tag || existing.tag
                                })
                            } else {
                                enrolledMap.set(stringId, c)
                            }
                        })

                        setClients(Array.from(enrolledMap.values()))
                    }
                })
            } catch (error) {
                console.error("[useAttendance] Erro ao carregar dados:", error)
                toast.error("Erro ao carregar dados de presença")
            }
        }

        loadData()
    }, [isOpen, schedule, idTenant, idBranch, isReady, withLoading])

    // Busca de clientes assíncrona
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchText.length >= 3) {
                setIsSearching(true)
                try {
                    const results = await ClientService.searchClients(idTenant, idBranch, searchText)
                    setSearchResults(results)
                } catch (error) {
                    console.error("Erro na busca:", error)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchText, idTenant, idBranch])

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

        const liveStatus = ClientService.calculateLiveStatus(client)

        // Validação de status
        if (liveStatus === 'suspended') {
            toast.error("Este aluno está SUSPENSO e não pode realizar check-in.")
            return
        }

        if (liveStatus === 'inactive' || liveStatus === 'lost') {
            toast.warning(`Atenção: Aluno com status '${liveStatus}'.`)
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
                clientStatus: liveStatus
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
        isSearching,
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
