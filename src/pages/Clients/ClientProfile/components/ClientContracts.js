import React, { useState } from 'react'
import { Row, Col, Card, CardBody, Badge, Button, Table, Spinner, UncontrolledTooltip, Alert } from 'reactstrap'
import { useClientFinancial } from '../hooks/useClientFinancial'
import { formatCurrency } from '../../../../utils/format'
import { formatDate } from '../../../../utils/date'
import StatusBadge from '../../../../components/Common/StatusBadge'
import { ClientContractService } from '../../../../features/clients/services/ClientContractService'
import { useTenant } from '../../../../hooks/useTenant'
import { toast } from 'react-toastify'

// Modals
import ContractAdjustDaysModal from './ContractModals/ContractAdjustDaysModal'
import ContractSuspendModal from './ContractModals/ContractSuspendModal'
import ContractTransferModal from './ContractModals/ContractTransferModal'
import ContractCancelModal from './ContractModals/ContractCancelModal'
import ConfirmDialog from '../../../../components/Common/ConfirmDialog'

const ClientContracts = ({ client }) => {
    const { idTenant, idBranch, user } = useTenant()
    const { contracts, loading, refreshData } = useClientFinancial()

    // Modal States
    const [modalState, setModalState] = useState({
        adjust: { open: false, mode: 'add' },
        suspend: { open: false },
        transfer: { open: false },
        cancel: { open: false },
        details: { open: false },
        reactivate: { open: false }
    })

    const toggleModal = (key, extra = {}) => {
        setModalState(prev => ({
            ...prev,
            [key]: { ...prev[key], open: !prev[key].open, ...extra }
        }))
    }

    const activeContract = contracts?.find(c => c.status === 'active' || c.status === 'suspended')
    const isSuspended = activeContract?.status === 'suspended'

    const handleConfirmAdjust = async (values) => {
        try {
            await ClientContractService.adjustDays(
                idTenant,
                idBranch,
                user.uid,
                activeContract.id,
                values.days,
                modalState.adjust.mode,
                values.reason
            )
            toast.success("Vigência do contrato ajustada com sucesso!")
            refreshData()
            toggleModal('adjust')
        } catch (error) {
            console.error("Erro ao ajustar contrato:", error)
            toast.error(error.message || "Erro ao realizar ajuste")
        }
    }

    const handleConfirmSuspend = async (values) => {
        try {
            await ClientContractService.suspend(
                idTenant,
                idBranch,
                user.uid,
                activeContract.id,
                values,
                values.reason
            )
            toast.success("Contrato suspenso com sucesso!")
            refreshData()
            toggleModal('suspend')
        } catch (error) {
            console.error("Erro ao suspender contrato:", error)
            toast.error(error.message || "Erro ao suspender")
        }
    }

    const handleConfirmCancel = async (values) => {
        try {
            await ClientContractService.cancel(
                idTenant,
                idBranch,
                user.uid,
                activeContract.id,
                values
            )
            toast.success("Contrato cancelado com sucesso!")
            refreshData()
            toggleModal('cancel')
        } catch (error) {
            console.error("Erro ao cancelar contrato:", error)
            toast.error(error.message || "Erro ao cancelar")
        }
    }

    const handleConfirmReactivate = async () => {
        try {
            await ClientContractService.reactivate(
                idTenant,
                idBranch,
                user.uid,
                activeContract.id
            )
            toast.success("Contrato reativado com sucesso!")
            refreshData()
            toggleModal('reactivate')
        } catch (error) {
            console.error("Erro ao reativar contrato:", error)
            toast.error(error.message || "Erro ao reativar")
        }
    }

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="text-muted mt-2">Carregando histórico de contratos...</p>
            </div>
        )
    }

    // Remover declaração duplicada
    const sortedContracts = [...(contracts || [])].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (a.status !== 'active' && b.status === 'active') return 1
        return new Date(b.startDate) - new Date(a.startDate)
    })
    const pastContracts = sortedContracts.filter(c => c.id !== activeContract?.id)

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Contrato Ativo em Destaque */}
            {activeContract ? (
                <div className="mb-4">
                    <h5 className="font-size-16 fw-bold mb-3 text-primary">
                        <i className="mdi mdi-shield-check-outline me-2"></i>Contrato Ativo
                    </h5>
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardBody className="p-4">
                            <Row className="g-4">
                                {/* Informações do Plano */}
                                <Col lg={4} className="border-end">
                                    <div className="d-flex align-items-start">
                                        <div className="avatar-md me-3">
                                            <span className="avatar-title rounded-circle bg-soft-success text-success font-size-24">
                                                <i className="mdi mdi-file-certificate"></i>
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-size-18 mb-1 fw-bold text-dark">{activeContract.planName}</h4>
                                            <p className="text-muted mb-2 font-size-13">{activeContract.friendlyId}</p>
                                            <Badge color="soft-success" className="font-size-11 text-uppercase px-2">Em Vigência</Badge>
                                        </div>
                                    </div>
                                </Col>

                                {/* Datas e Valores */}
                                <Col lg={3} className="border-end">
                                    <div className="px-3">
                                        <div className="mb-3">
                                            <p className="text-muted mb-1 font-size-11 text-uppercase fw-bold">Período</p>
                                            <h6 className="mb-0 fw-semibold text-dark">
                                                {formatDate(activeContract.startDate)}
                                                <i className="mdi mdi-arrow-right mx-2 text-muted"></i>
                                                {formatDate(activeContract.endDate)}
                                            </h6>
                                        </div>
                                        <div>
                                            <p className="text-muted mb-1 font-size-11 text-uppercase fw-bold">Valor Mensal</p>
                                            <h5 className="mb-0 text-primary fw-bold">{formatCurrency(activeContract.value)}</h5>
                                        </div>
                                    </div>
                                </Col>

                                {/* Regras e Condições */}
                                <Col lg={5}>
                                    <div className="ps-3">
                                        <p className="text-muted mb-2 font-size-11 text-uppercase fw-bold">Regras do Plano</p>
                                        <div className="d-flex flex-wrap gap-2">
                                            {/* Suspensão */}
                                            {activeContract.rules?.allowFreeze !== false ? (
                                                <Badge color="soft-info" className="px-2 py-1">
                                                    <i className="mdi mdi-pause-circle-outline me-1"></i>
                                                    Suspensão: até {activeContract.rules?.maxFreezeDays || 30} dias
                                                </Badge>
                                            ) : (
                                                <Badge color="soft-danger" className="px-2 py-1">
                                                    <i className="mdi mdi-lock-outline me-1"></i>
                                                    Sem Suspensão
                                                </Badge>
                                            )}

                                            {/* Permanência */}
                                            {activeContract.rules?.minPermanence > 0 && (
                                                <Badge color="soft-warning" className="px-2 py-1">
                                                    <i className="mdi mdi-shield-account-outline me-1"></i>
                                                    Fidelidade: {activeContract.rules.minPermanence} meses
                                                </Badge>
                                            )}

                                            {/* Dias da Semana */}
                                            {activeContract.rules?.allowedWeekDays?.length > 0 && (
                                                <Badge color="soft-secondary" className="px-2 py-1">
                                                    <i className="mdi mdi-calendar-check me-1"></i>
                                                    Dias: {activeContract.rules?.allowedWeekDays?.length}x semana
                                                </Badge>
                                            )}

                                            {/* Limite de Acesso */}
                                            {activeContract.rules?.accessLimitType && activeContract.rules?.accessLimitType !== 'unlimited' && (
                                                <Badge color="soft-primary" className="px-2 py-1">
                                                    <i className="mdi mdi-clock-check-outline me-1"></i>
                                                    Limite: {activeContract.rules?.accessLimitQuantity || 0} total
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Estatísticas de Suspensão */}
                                        {activeContract.rules?.allowFreeze !== false && (
                                            <div className="mt-3 p-2 bg-light rounded border border-dashed">
                                                <div className="d-flex justify-content-between align-items-center small">
                                                    <span className="text-muted"><i className="mdi mdi-clock-fast me-1"></i>Uso de Suspensão:</span>
                                                    <span className="fw-bold">
                                                        {activeContract.suspension?.totalDaysUsed || 0} / {activeContract.rules?.maxFreezeDays || 30} dias
                                                    </span>
                                                </div>
                                                <div className="progress progress-sm mt-1" style={{ height: '4px' }}>
                                                    <div
                                                        className={`progress-bar ${(activeContract.suspension?.totalDaysUsed || 0) > (activeContract.rules?.maxFreezeDays || 30) * 0.8 ? 'bg-danger' : 'bg-info'}`}
                                                        style={{ width: `${Math.min(100, ((activeContract.suspension?.totalDaysUsed || 0) / (activeContract.rules?.maxFreezeDays || 30)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="d-flex justify-content-between mt-1 small">
                                                    <span className="text-muted font-size-10">{activeContract.suspension?.totalOccurrences || 0} utilizações</span>
                                                    <span className="text-info font-size-10 fw-bold">{(activeContract.rules?.maxFreezeDays || 30) - (activeContract.suspension?.totalDaysUsed || 0)} dias restantes</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 d-flex gap-2">
                                            <Button color="light" size="sm" className="btn-rounded px-3" id="detailsBtn">
                                                <i className="mdi mdi-information-outline me-1"></i> Dados
                                            </Button>

                                            <div className="btn-group btn-group-sm shadow-sm rounded-pill">
                                                <Button color="info" outline className="border-end-0" id="addDaysBtn" onClick={() => toggleModal('adjust', { mode: 'add' })}>
                                                    <i className="mdi mdi-calendar-plus"></i>
                                                </Button>
                                                <Button color="info" outline className="border-start-0" id="subDaysBtn" onClick={() => toggleModal('adjust', { mode: 'sub' })}>
                                                    <i className="mdi mdi-calendar-remove"></i>
                                                </Button>
                                            </div>

                                            {isSuspended ? (
                                                <Button color="success" size="sm" className="btn-rounded px-3 shadow-sm" id="reactivateBtn" onClick={() => toggleModal('reactivate')}>
                                                    <i className="mdi mdi-play-circle-outline me-1"></i> Reativar Agora
                                                </Button>
                                            ) : (
                                                <Button color="warning" outline size="sm" className="btn-rounded px-3" id="suspendBtn" onClick={() => toggleModal('suspend')}>
                                                    <i className="mdi mdi-pause-circle-outline me-1"></i> Suspender
                                                </Button>
                                            )}

                                            <Button color="primary" outline size="sm" className="btn-rounded px-3" id="transferBtn" onClick={() => toggleModal('transfer')}>
                                                <i className="mdi mdi-account-switch-outline me-1"></i> Transferir
                                            </Button>

                                            <Button color="danger" outline size="sm" className="btn-rounded px-3" id="cancelBtn" onClick={() => toggleModal('cancel')}>
                                                <i className="mdi mdi-close-circle-outline me-1"></i> Cancelar
                                            </Button>
                                        </div>

                                        <UncontrolledTooltip target="detailsBtn">Ver detalhes e histórico</UncontrolledTooltip>
                                        <UncontrolledTooltip target="addDaysBtn">Adicionar dias de vigência</UncontrolledTooltip>
                                        <UncontrolledTooltip target="subDaysBtn">Debitar dias de vigência</UncontrolledTooltip>
                                        {isSuspended ? (
                                            <UncontrolledTooltip target="reactivateBtn">Voltar a utilizar o plano hoje</UncontrolledTooltip>
                                        ) : (
                                            <UncontrolledTooltip target="suspendBtn">Pausar contrato</UncontrolledTooltip>
                                        )}
                                        <UncontrolledTooltip target="transferBtn">Transferir titularidade</UncontrolledTooltip>
                                        <UncontrolledTooltip target="cancelBtn">Encerrar definitivamente</UncontrolledTooltip>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </div>
            ) : (
                <Card className="border-0 shadow-sm mb-4 bg-soft-light border-dashed">
                    <CardBody className="py-5 text-center">
                        <div className="avatar-md mx-auto mb-3">
                            <span className="avatar-title rounded-circle bg-white text-muted font-size-24 border">
                                <i className="mdi mdi-file-document-outline"></i>
                            </span>
                        </div>
                        <h5 className="text-dark fw-bold">Nenhum contrato ativo</h5>
                        <p className="text-muted">Este cliente não possui uma matrícula ativa no momento.</p>
                        <Button color="primary" className="btn-rounded">
                            Nova Venda / Matrícula
                        </Button>
                    </CardBody>
                </Card>
            )}

            {/* Histórico de Contratos */}
            <h5 className="font-size-16 fw-bold mb-3 mt-4">
                <i className="mdi mdi-history me-2 text-muted"></i>Histórico de Contratos
            </h5>
            <Card className="border-0 shadow-sm">
                <CardBody className="p-0">
                    <div className="table-responsive">
                        <Table className="table-nowrap table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Contrato</th>
                                    <th>Data Início</th>
                                    <th>Data Fim</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastContracts.length > 0 ? (
                                    pastContracts.map((contract) => (
                                        <tr key={contract.id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-xs me-3">
                                                        <span className={`avatar-title rounded-circle ${contract.status === 'cancelled' ? 'bg-soft-danger text-danger' : 'bg-soft-secondary text-secondary'} font-size-14`}>
                                                            <i className="mdi mdi-file-document-outline"></i>
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h6 className="font-size-14 mb-0 fw-semibold">{contract.planName}</h6>
                                                        <small className="text-muted">{contract.friendlyId}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatDate(contract.startDate)}</td>
                                            <td>{formatDate(contract.endDate)}</td>
                                            <td>{formatCurrency(contract.value)}</td>
                                            <td>
                                                <StatusBadge status={contract.status} />
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button color="link" className="text-primary p-0">
                                                    <i className="mdi mdi-eye-outline fs-5"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">
                                            Não há outros registros de contratos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>

            {/* Modals Implementation */}
            <ContractAdjustDaysModal
                isOpen={modalState.adjust.open}
                toggle={() => toggleModal('adjust')}
                contract={activeContract}
                mode={modalState.adjust.mode}
                onConfirm={handleConfirmAdjust}
            />

            <ContractSuspendModal
                isOpen={modalState.suspend.open}
                toggle={() => toggleModal('suspend')}
                contract={activeContract}
                onConfirm={handleConfirmSuspend}
            />

            <ContractTransferModal
                isOpen={modalState.transfer.open}
                toggle={() => toggleModal('transfer')}
                contract={activeContract}
                onConfirm={(data) => {
                    console.log("Transferência:", data)
                    toggleModal('transfer')
                }}
            />

            <ContractCancelModal
                isOpen={modalState.cancel.open}
                toggle={() => toggleModal('cancel')}
                contract={activeContract}
                onConfirm={handleConfirmCancel}
            />

            <ConfirmDialog
                isOpen={modalState.reactivate.open}
                toggle={() => toggleModal('reactivate')}
                title="Reativar Matrícula"
                description={
                    <div>
                        <p>Deseja reativar esta matrícula agora?</p>
                        <Alert color="soft-info" className="small border-0 mb-0">
                            A data de término do contrato será <strong>postergada proporcionalmente</strong> ao tempo em que o aluno ficou afastado.
                        </Alert>
                    </div>
                }
                confirmText="Sim, Reativar"
                confirmColor="success"
                onConfirm={handleConfirmReactivate}
            />
        </div >
    )
}

export default ClientContracts
