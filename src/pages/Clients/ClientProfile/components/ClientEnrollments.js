import React, { useState } from 'react'
import { Row, Col, Card, CardBody, Badge, Button, Table, Spinner } from 'reactstrap'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../../../hooks/useTenant'
import { useClientEnrollments } from '../hooks/useClientEnrollments'
import { useClientFinancial } from '../hooks/useClientFinancial'
import { ENROLLMENT_STATUS_CONFIG } from '../../../../data/schemas/Clients/EnrollmentSchema'
import { EnrollmentService } from '../../../../services/Clients/EnrollmentService'
import { toast } from 'react-toastify'
import ConfirmDialog from '../../../../components/Common/ConfirmDialog'

const ClientEnrollments = ({ client }) => {
    const navigate = useNavigate()
    const { idTenant, idBranch, tenantSlug, branchSlug, user } = useTenant()
    const { activeEnrollments, pastEnrollments, loading, refreshData } = useClientEnrollments(client?.id)
    const { contracts } = useClientFinancial()

    const [cancelModal, setCancelModal] = useState({ open: false, enrollment: null })
    const [cancelling, setCancelling] = useState(false)



    // Verifica se cliente tem contrato ativo
    const hasActiveContract = contracts?.some(c => {

        return c.status === 'active'
    }) || false



    const handleNavigateToEnroll = () => {

        // Buscar o primeiro contrato ativo
        const activeContract = contracts?.find(c => c.status === 'active')



        if (!activeContract || !activeContract.id) {
            console.error('❌ [ClientEnrollments] No active contract found!')
            toast.error('Nenhum contrato ativo encontrado. Por favor, recarregue a página.')
            return
        }



        const tLink = tenantSlug || idTenant
        const bLink = branchSlug || idBranch
        const clientFullName = `${client.firstName} ${client.lastName}`
        const url = `/${tLink}/${bLink}/grade/enroll?idClient=${client.id}&clientName=${encodeURIComponent(clientFullName)}&mode=regular&idContract=${activeContract.id}`



        navigate(url)
    }

    const handleNavigateToTrial = () => {
        const tLink = tenantSlug || idBranch
        const bLink = branchSlug || idBranch
        navigate(`/${tLink}/${bLink}/grade/enroll?idClient=${client.id}&clientName=${client.firstName} ${client.lastName}&mode=trial`)
    }

    const handleCancelEnrollment = async () => {
        if (!cancelModal.enrollment) {
            return
        }

        try {
            setCancelling(true)
            await EnrollmentService.cancelEnrollment(
                idTenant,
                idBranch,
                user,
                cancelModal.enrollment.id,
                ''
            )
            toast.success('Matrícula cancelada com sucesso!')
            refreshData()
            setCancelModal({ open: false, enrollment: null })
        } catch (error) {
            toast.error(error.message || 'Erro ao cancelar matrícula')
        } finally {
            setCancelling(false)
        }
    }

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="text-muted mt-2">Carregando matrículas...</p>
            </div>
        )
    }

    const getStatusBadge = (status) => {
        const config = ENROLLMENT_STATUS_CONFIG[status] || ENROLLMENT_STATUS_CONFIG.active
        return (
            <Badge color={config.color} className="px-2 py-1">
                <i className={`mdi mdi-${config.icon} me-1`}></i>
                {config.label}
            </Badge>
        )
    }


    return (
        <div className="animate__animated animate__fadeIn">
            {/* Matrículas Ativas */}
            {activeEnrollments.length > 0 ? (
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="font-size-16 fw-bold text-primary">
                            <i className="mdi mdi-checkbox-marked-circle-outline me-2"></i>Matrículas Ativas
                        </h5>
                        {hasActiveContract && (
                            <Button color="success" size="sm" onClick={handleNavigateToEnroll}>
                                <i className="mdi mdi-plus-circle me-1"></i> Nova Matrícula
                            </Button>
                        )}
                    </div>

                    {activeEnrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="border-0 shadow-sm overflow-hidden mb-3">
                            <CardBody className="p-4">
                                <Row className="g-4">
                                    {/* Info da Matrícula */}
                                    <Col lg={10}>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-sm me-3">
                                                <span className={`avatar-title rounded-circle ${enrollment.enrollmentType === 'trial' ? 'bg-soft-warning text-warning' : 'bg-soft-success text-success'} font-size-20`}>
                                                    <i className={`mdi mdi-${enrollment.enrollmentType === 'trial' ? 'star' : 'account-check'}`}></i>
                                                </span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center flex-wrap gap-3">
                                                    <div>
                                                        <h5 className="font-size-15 mb-0 fw-bold text-dark">
                                                            {enrollment.activityName || 'Atividade'}
                                                        </h5>
                                                        <small className="text-muted">{enrollment.className || 'Turma'}</small>
                                                    </div>

                                                    {enrollment.startTime && enrollment.endTime && (
                                                        <div className="d-flex align-items-center text-muted">
                                                            <i className="mdi mdi-clock-outline me-1"></i>
                                                            <strong>{enrollment.startTime} - {enrollment.endTime}</strong>
                                                        </div>
                                                    )}

                                                    {enrollment.instructorName && (
                                                        <div className="d-flex align-items-center text-muted">
                                                            <i className="mdi mdi-account-tie me-1"></i>
                                                            <span>{enrollment.instructorName}</span>
                                                        </div>
                                                    )}

                                                    <div>
                                                        {getStatusBadge(enrollment.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>





                                    {/* Ações */}
                                    <Col lg={2}>
                                        <div className="d-flex flex-column gap-2">
                                            <Button
                                                color="danger"
                                                outline
                                                size="sm"
                                                className="btn-rounded"
                                                onClick={() => setCancelModal({ open: true, enrollment })}
                                            >
                                                <i className="mdi mdi-close-circle-outline me-1"></i> Cancelar
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-sm mb-4 bg-soft-light border-dashed">
                    <CardBody className="py-5 text-center">
                        <div className="avatar-md mx-auto mb-3">
                            <span className="avatar-title rounded-circle bg-white text-muted font-size-24 border">
                                <i className="mdi mdi-account-school-outline"></i>
                            </span>
                        </div>
                        <h5 className="text-dark fw-bold">Nenhuma matrícula ativa</h5>
                        <p className="text-muted mb-3">
                            {hasActiveContract
                                ? 'Este cliente possui contrato ativo, mas ainda não está matriculado em nenhuma turma.'
                                : 'Este cliente não possui contrato ativo no momento.'}
                        </p>
                        <div className="d-flex gap-2 justify-content-center">
                            {hasActiveContract ? (
                                <Button color="success" onClick={handleNavigateToEnroll}>
                                    <i className="mdi mdi-calendar-plus me-1"></i> Matricular em Turmas
                                </Button>
                            ) : (
                                <Button color="warning" onClick={handleNavigateToTrial}>
                                    <i className="mdi mdi-star me-1"></i> Agendar Aula Experimental
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Histórico de Matrículas */}
            <h5 className="font-size-16 fw-bold mb-3 mt-4">
                <i className="mdi mdi-history me-2 text-muted"></i>Histórico de Matrículas
            </h5>
            <Card className="border-0 shadow-sm">
                <CardBody className="p-0">
                    <div className="table-responsive">
                        <Table className="table-nowrap table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Atividade/Turma</th>
                                    <th>Horário</th>
                                    <th>Professor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastEnrollments.length > 0 ? (
                                    pastEnrollments.map((enrollment) => (
                                        <tr key={enrollment.id}>
                                            <td className="ps-4">
                                                <div>
                                                    <h6 className="font-size-14 mb-0 fw-semibold">{enrollment.activityName || 'Atividade'}</h6>
                                                    <small className="text-muted">{enrollment.className || 'Turma'}</small>
                                                </div>
                                            </td>
                                            <td>
                                                {enrollment.startTime && enrollment.endTime ? (
                                                    <span>{enrollment.startTime} - {enrollment.endTime}</span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td>
                                                {enrollment.instructorName || <span className="text-muted">-</span>}
                                            </td>
                                            <td>{getStatusBadge(enrollment.status)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">
                                            Não há outros registros de matrículas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>

            {/* Modal de Cancelamento */}
            <ConfirmDialog
                isOpen={cancelModal.open}
                toggle={() => setCancelModal({ open: false, enrollment: null })}
                title="Cancelar Matrícula"
                description={
                    <div>
                        <p>Deseja realmente cancelar a matrícula de <strong>{client?.firstName} {client?.lastName}</strong> em <strong>{cancelModal.enrollment?.activityName}</strong>?</p>
                    </div>
                }
                confirmText="Sim, Cancelar"
                confirmColor="danger"
                onConfirm={handleCancelEnrollment}
                loading={cancelling}
            />
        </div>
    )
}

export default ClientEnrollments
