import React, { useEffect, useMemo, useState } from "react"
import { Card, CardBody, Button } from "reactstrap"
import { useNavigate, useLocation } from "react-router-dom"
import { connect } from "react-redux"
import { toast } from "react-toastify"

import GradeHeader from "../Components/GradeHeader"
import GradeGrid from "../Components/GradeGrid"
import { getStartOfWeek } from "../../../utils/sharedUtils"
import { setBreadcrumbItems } from "../../../store/actions"
import { useGradeData } from "../Hooks/useGradeData"
import PageLoader from "../../../components/Common/PageLoader"
import { EnrollmentService } from "../../../services/Clients/EnrollmentService"
import { ClientService } from "../../../services/Clients/ClientService"
import { automationService } from "../../../services/Automation/AutomationService"
import { useTenant } from "../../../hooks/useTenant"
import moment from "moment"

import "./EnrollmentGrade.scss"

const EnrollmentGrade = ({ setBreadcrumbItems }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { idTenant, idBranch, tenantSlug, branchSlug, user } = useTenant()

    // Parâmetros da URL
    const searchParams = new URLSearchParams(location.search)
    const idClient = searchParams.get('idClient')
    const clientName = searchParams.get('clientName')
    const mode = searchParams.get('mode') // 'regular' ou 'trial'
    const idContract = searchParams.get('idContract')



    // Estados
    const [turn, setTurn] = useState("all")
    const [view, setView] = useState("week")
    const [referenceDate, setReferenceDate] = useState(new Date())
    const [showOccupancy, setShowOccupancy] = useState(true)
    const [selectedClasses, setSelectedClasses] = useState([]) // Para mode=regular
    const [selectedSession, setSelectedSession] = useState(null) // Para mode=trial
    const [enrolling, setEnrolling] = useState(false)
    const [existingEnrollments, setExistingEnrollments] = useState([]) // Matrículas já existentes

    const { sessions, activities, areas, staff, loading: loadingData, refresh } = useGradeData(referenceDate)

    // Buscar matrículas existentes do cliente
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

    const weekStart = useMemo(() => getStartOfWeek(referenceDate), [referenceDate])

    // Enriquecer dados das sessões
    const schedules = useMemo(() => {
        return sessions.map(session => {
            const activity = (activities || []).find(a => String(a.id) === String(session.idActivity)) || {}
            const area = (areas || []).find(a => String(a.id) === String(session.idArea)) || {}
            const instructor = (staff || []).find(i => String(i.id) === String(session.idStaff)) || {}

            return {
                ...session,
                activityName: activity.name || 'Atividade',
                activityColor: activity.color || activity.colorHex || '#4CAF50',
                areaName: area.name || '',
                areaColor: area.color || area.colorHex || '#2196F3',
                instructorName: instructor.name || '',
                employeeName: instructor.name || '',
                capacity: session.capacity || session.maxCapacity || 20,
                enrolledCount: session.enrolledCount || 0,
                isActive: session.isActive !== false,
            }
        })
    }, [sessions, activities, areas, staff])

    // Handler de seleção
    const handleSelectSchedule = (schedule, iso) => {


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
                // Agendar experimental
                await EnrollmentService.scheduleTrialClass(idTenant, idBranch, user, {
                    idClient,
                    sessionId: selectedSession,
                    clientName: clientName || 'Cliente'
                })

                // --- AUTOMAÇÃO: Enviar msg para Aluno e Professor ---
                try {
                    // 1. Buscar dados completos do cliente (precisamos do telefone)
                    const clientData = await ClientService.getClientById(idTenant, idBranch, idClient)

                    // 2. Buscar dados da sessão (precisamos do horário e do professor)
                    const sessionData = schedules.find(s => s.id === selectedSession) || {}
                    const instructor = staff.find(s => String(s.id) === String(sessionData.idStaff)) || {}

                    if (sessionData && clientData) {
                        const dateFormatted = moment(sessionData.sessionDate).format('DD/MM/YYYY')
                        const timeFormatted = sessionData.startTime

                        // Disparar para o ALUNO
                        await automationService.emit(idTenant, 'EXPERIMENTAL_SCHEDULED', {
                            student: clientData.name, // Nome no template
                            name: clientData.name,    // Alias
                            date: dateFormatted,
                            time: timeFormatted,
                            phone: clientData.phone || clientData.mobile || clientData.cellPhone || clientData.responsavelPhone
                        })

                        // Pequeno delay para não sobrecarregar a API do WhatsApp
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // Disparar para o PROFESSOR (se houver e tiver telefone)
                        if (instructor && (instructor.mobile || instructor.phone || instructor.cellPhone)) {
                            await automationService.emit(idTenant, 'EXPERIMENTAL_SCHEDULED_TEACHER', {
                                student: clientData.name,
                                date: dateFormatted,
                                time: timeFormatted,
                                phone: instructor.mobile || instructor.phone || instructor.cellPhone
                            })
                        }
                    }
                } catch (autoError) {
                    console.error("Erro ao disparar automações de agendamento:", autoError)
                }
                // ----------------------------------------------------

                toast.success('Aula experimental agendada com sucesso!')
            } else {
                // Matrícula regular


                await EnrollmentService.enrollStudent(idTenant, idBranch, user, {
                    idClient,
                    idContract, // Usando a variável já capturada
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

    const handleCancel = () => {
        navigate(-1)
    }

    if (loadingData && !sessions.length) {
        return <PageLoader />
    }

    // Verificar se uma turma já tem matrícula ativa
    const isClassEnrolled = (schedule) => {
        return existingEnrollments.some(e => e.idClass === schedule.idClass)
    }

    // Verificar quais turmas estão selecionadas
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
                <CardBody className="pb-2">
                    <GradeHeader
                        turn={turn}
                        onTurnChange={setTurn}
                        view={view}
                        onViewChange={setView}
                        referenceDate={referenceDate}
                        onReferenceDateChange={setReferenceDate}
                        showOccupancy={showOccupancy}
                        onShowOccupancyChange={setShowOccupancy}
                    />
                </CardBody>
            </Card>

            {/* Grade de Seleção */}
            <Card>
                <CardBody>
                    {!loadingData && sessions.length === 0 && (
                        <div className="alert alert-warning mb-3">
                            <i className="mdi mdi-alert me-2"></i>
                            <strong>Nenhuma sessão encontrada.</strong>
                            <p className="mb-0 mt-2">
                                Não há sessões disponíveis para seleção neste período.
                            </p>
                        </div>
                    )}
                    <GradeGrid
                        turn={turn}
                        view={view}
                        referenceDate={referenceDate}
                        weekStart={weekStart}
                        schedules={schedules}
                        showOccupancy={showOccupancy}
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

            {/* Botões de Ação Fixos */}
            <div className="enrollment-actions-footer">
                <Card className="border-0 shadow-lg">
                    <CardBody className="py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-1 fw-bold">
                                    {mode === 'trial'
                                        ? selectedSession ? '1 sessão selecionada' : 'Nenhuma sessão selecionada'
                                        : `${selectedClasses.length} turma(s) selecionada(s)`
                                    }
                                </h6>
                                <small className="text-muted">
                                    {clientName || 'Cliente não identificado'}
                                </small>
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    color="secondary"
                                    onClick={handleCancel}
                                    disabled={enrolling}
                                >
                                    <i className="mdi mdi-close me-1"></i> Cancelar
                                </Button>
                                <Button
                                    color={mode === 'trial' ? 'warning' : 'success'}
                                    onClick={handleConfirm}
                                    disabled={enrolling || (mode === 'trial' ? !selectedSession : selectedClasses.length === 0)}
                                >
                                    {enrolling ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <i className={`mdi mdi-${mode === 'trial' ? 'star' : 'check'} me-1`}></i>
                                            {mode === 'trial' ? 'Agendar Experimental' : 'Confirmar Matrícula'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(EnrollmentGrade)
