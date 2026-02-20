import React, { useEffect, useState } from "react"
import { Card, CardBody, Button } from "reactstrap"
import { useNavigate, useLocation } from "react-router-dom"
import { connect } from "react-redux"
import { toast } from "react-toastify"

import GradeHeader from "../Components/GradeHeader"
import GradeGrid from "../Components/GradeGrid"
import { formatDate } from "../../../utils/date"
import { setBreadcrumbItems } from "../../../store/actions"
import { useGrade } from "../../../contexts/GradeContext"

import { EnrollmentService } from "../../../services/Clients/EnrollmentService"
import { ClientService } from "../../../services/Clients/ClientService"
import { automationService } from "../../../services/Automation/AutomationService"
import { useTenant } from "../../../hooks/useTenant"

import "./EnrollmentGrade.scss"

/**
 * Página de Seleção de Turma/Sessão para Matrícula ou Aula Experimental.
 * Consome o GradeContext para manter a data e filtros sincronizados com a Grade Principal.
 */
const EnrollmentGrade = ({ setBreadcrumbItems }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { idTenant, idBranch, tenantSlug, branchSlug, user } = useTenant()

    // 1. Estados Compartilhados via GradeContext
    const {
        sessions,
        loading: loadingData,
        refresh,
        referenceDate,
        setReferenceDate,
        view,
        setView,
        turn,
        setTurn,
        weekStart
    } = useGrade()

    // 2. Parâmetros da URL
    const searchParams = new URLSearchParams(location.search)
    const idClient = searchParams.get('idClient')
    const clientName = searchParams.get('clientName')
    const mode = searchParams.get('mode') // 'regular' ou 'trial'
    const idContract = searchParams.get('idContract')

    // 3. Estados Locais de Seleção
    const [selectedClasses, setSelectedClasses] = useState([]) // Para mode=regular
    const [selectedSession, setSelectedSession] = useState(null) // Para mode=trial
    const [enrolling, setEnrolling] = useState(false)
    const [existingEnrollments, setExistingEnrollments] = useState([]) // Matrículas já existentes

    // Buscar matrículas existentes do cliente para marcar na grade
    useEffect(() => {
        const fetchExistingEnrollments = async () => {
            if (!idClient || !idTenant || !idBranch) return

            try {
                const enrollments = await EnrollmentService.listClientEnrollments(idTenant, idBranch, idClient)
                const activeEnrollments = enrollments.filter(e => e.status === 'active')
                setExistingEnrollments(activeEnrollments)

            } catch (error) {
                console.error('Erro ao buscar matrículas existentes:', error)
            }
        }

        fetchExistingEnrollments()
    }, [idClient, idTenant, idBranch])

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Grade de Aulas", link: "/grade" },
            { title: mode === 'trial' ? "Agendar Experimental" : "Matricular Aluno", link: "#" }
        ]
        setBreadcrumbItems(mode === 'trial' ? "Agendar Experimental" : "Matricular Aluno", breadcrumbItems)
    }, [setBreadcrumbItems, mode])

    // Handler de seleção
    const handleSelectSchedule = (schedule) => {
        if (mode === 'trial') {
            // Modo experimental: seleciona apenas UMA sessão
            setSelectedSession(schedule.id === selectedSession ? null : schedule.id)
        } else {
            // Modo regular: seleciona a TURMA (idClass)
            const classId = schedule.idClass
            if (selectedClasses.includes(classId)) {
                setSelectedClasses(prev => prev.filter(id => id !== classId))
            } else {
                setSelectedClasses(prev => [...prev, classId])
            }
        }
    }

    // Confirmar matrícula/experimental
    const handleConfirm = async () => {
        if (!idClient) {
            toast.error('Cliente não identificado')
            return
        }

        if (mode === 'trial' && !selectedSession) {
            toast.error('Selecione uma sessão para a aula experimental')
            return
        }

        if (mode === 'regular' && selectedClasses.length === 0) {
            toast.error('Selecione ao menos uma turma para matrícula')
            return
        }

        try {
            setEnrolling(true)

            if (mode === 'trial') {
                // Agendar experimental
                await EnrollmentService.scheduleTrialClass(idTenant, idBranch, user, {
                    idClient,
                    sessionId: selectedSession,
                    clientName: clientName || 'Cliente'
                })

                // --- AUTOMAÇÃO: Enviar msg para Aluno e Professor ---
                try {
                    const clientData = await ClientService.getClientById(idTenant, idBranch, idClient)
                    const sessionData = (sessions || []).find(s => s.id === selectedSession) || {}

                    if (sessionData && clientData) {
                        const dateFormatted = formatDate(sessionData.sessionDate)
                        const timeFormatted = sessionData.startTime

                        // Disparar para o ALUNO
                        await automationService.emit(idTenant, 'EXPERIMENTAL_SCHEDULED', {
                            client: clientData.name,
                            name: clientData.name,
                            date: dateFormatted,
                            time: timeFormatted,
                            phone: clientData.phone || clientData.mobile || clientData.cellPhone || clientData.responsavelPhone
                        })

                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // Disparar para o PROFESSOR
                        if (sessionData.instructorPhone) {
                            await automationService.emit(idTenant, 'EXPERIMENTAL_SCHEDULED_TEACHER', {
                                client: clientData.name,
                                date: dateFormatted,
                                time: timeFormatted,
                                phone: sessionData.instructorPhone
                            })
                        }
                    }
                } catch (autoError) {
                    console.error("Erro ao disparar automações de agendamento:", autoError)
                }

                toast.success('Aula experimental agendada com sucesso!')
            } else {
                // Matrícula regular
                await EnrollmentService.enrollClient(idTenant, idBranch, user, {
                    idClient,
                    idContract,
                    classIds: selectedClasses,
                    clientName: clientName || 'Cliente'
                })
                toast.success(`${clientName || 'Cliente'} matriculado(a) com sucesso!`)
            }

            // Atualizar cache da grade antes de sair
            await refresh()

            // Voltar para o perfil
            const tLink = tenantSlug || idTenant
            const bLink = branchSlug || idBranch
            navigate(`/${tLink}/${bLink}/clients/${idClient}`)

        } catch (error) {
            console.error('Erro ao confirmar:', error)
            toast.error(error.message || 'Erro ao processar solicitação')
        } finally {
            setEnrolling(false)
        }
    }

    const handleCancel = () => navigate(-1)

    const isClassEnrolled = (schedule) => {
        return existingEnrollments.some(e => e.idClass === schedule.idClass)
    }

    const isClassSelected = (schedule) => {
        if (mode === 'trial') {
            return schedule.id === selectedSession
        } else {
            return selectedClasses.includes(schedule.idClass)
        }
    }

    return (
        <React.Fragment>
            {/* Controles da Grade */}
            <Card className="mb-3">
                <CardBody className="pb-2 d-flex justify-content-between align-items-center">
                    <div className="flex-grow-1">
                        <GradeHeader
                            turn={turn}
                            onTurnChange={setTurn}
                            view={view}
                            onViewChange={setView}
                            referenceDate={referenceDate}
                            onReferenceDateChange={setReferenceDate}
                        />
                    </div>
                    <div className="d-flex gap-2 ms-4">
                        <Button color="secondary" onClick={handleCancel} disabled={enrolling}>
                            <i className="mdi mdi-close me-1"></i> Cancelar
                        </Button>
                        <Button
                            color={mode === 'trial' ? 'warning' : 'success'}
                            onClick={handleConfirm}
                            disabled={enrolling || (mode === 'trial' ? !selectedSession : selectedClasses.length === 0)}
                        >
                            {enrolling ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span> Processando...</>
                            ) : (
                                <><i className={`mdi mdi-${mode === 'trial' ? 'star' : 'check'} me-1`}></i>
                                    {mode === 'trial' ? 'Agendar Experimental' : 'Confirmar Matrícula'}</>
                            )}
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Grade de Seleção */}
            <Card>
                <CardBody>
                    {!loadingData && sessions.length === 0 && (
                        <div className="alert alert-warning mb-3">
                            <i className="mdi mdi-alert me-2"></i>
                            <strong>Nenhuma sessão encontrada.</strong>
                            <p className="mb-0 mt-2">Não há sessões disponíveis para seleção neste período.</p>
                        </div>
                    )}
                    <GradeGrid
                        turn={turn}
                        view={view}
                        referenceDate={referenceDate}
                        weekStart={weekStart}
                        schedules={sessions}
                        loading={loadingData}
                        onSelectSchedule={handleSelectSchedule}
                        selectedScheduleId={null}
                        selectedScheduleKey={null}
                        mode="selection"
                        selectedClasses={selectedClasses}
                        selectedSession={selectedSession}
                        isClassSelected={isClassSelected}
                        isClassEnrolled={isClassEnrolled}
                    />
                </CardBody>
            </Card>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(EnrollmentGrade)
