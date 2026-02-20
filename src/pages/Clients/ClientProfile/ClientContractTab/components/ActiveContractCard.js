import React from 'react'
import { Card, CardBody, Badge, Button, Row, Col } from 'reactstrap'
import { formatDate } from '../../../../../utils/date'
import { formatCurrency } from '../../../../../utils/format'
import StatusBadge from '../../../../../components/Common/StatusBadge'

const ActiveContractCard = ({ contract, onAdjustDays, onSuspend, onReactivate, onTransfer, onCancel, onPrint }) => {
    const isSuspended = contract.status === 'suspended'

    return (
        <Card className="border-0 shadow-sm overflow-hidden mb-4 animate__animated animate__fadeIn">
            <CardBody className="p-4">
                <Row className="g-4">
                    {/* Informações do Plano */}
                    <Col lg={4} className="border-end">
                        <div className="d-flex align-items-start">
                            <div className="avatar-md me-3">
                                <span className={`avatar-title rounded-circle bg-soft-${isSuspended ? 'warning' : 'success'} text-${isSuspended ? 'warning' : 'success'} font-size-24`}>
                                    <i className="mdi mdi-file-certificate"></i>
                                </span>
                            </div>
                            <div>
                                <h4 className="font-size-18 mb-1 fw-bold text-dark">{contract.planName}</h4>
                                <p className="text-muted mb-2 font-size-13">{contract.idClientContract}</p>
                                <StatusBadge status={contract.status} />
                                {contract.isScholarship && (
                                    <div className="mt-2">
                                        <Badge color="soft-info" className="p-1">
                                            <i className="mdi mdi-school me-1"></i>Bolsista (Isenção)
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Datas e Valores */}
                    <Col lg={3} className="border-end">
                        <div className="px-3">
                            <div className="mb-3">
                                <p className="text-muted mb-1 font-size-11 text-uppercase fw-bold">Período</p>
                                <h6 className="mb-0 fw-semibold text-dark">
                                    {formatDate(contract.startDate)}
                                    <i className="mdi mdi-arrow-right mx-2 text-muted"></i>
                                    {formatDate(contract.endDate)}
                                </h6>
                            </div>
                            <div>
                                <p className="text-muted mb-1 font-size-11 text-uppercase fw-bold">
                                    {contract.planType === 'monthly' ? 'Valor Mensal' : 'Valor Total'}
                                </p>
                                <h5 className="mb-0 text-primary fw-bold">
                                    {formatCurrency(contract.value)}
                                    {contract.discount > 0.01 && (
                                        <small className="text-muted text-decoration-line-through ms-2 font-size-12">
                                            {formatCurrency(contract.originalValue || (contract.value + contract.discount))}
                                        </small>
                                    )}
                                </h5>
                                {contract.discount > 0.01 && (
                                    <Badge color="soft-danger" className="mt-1 font-size-10">
                                        Desconto Aplicado: {formatCurrency(contract.discount)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Regras e Ações */}
                    <Col lg={5}>
                        <div className="ps-3">
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {contract.rules?.minPermanence > 0 && (
                                    <Badge color="soft-warning" className="px-2 py-1">
                                        <i className="mdi mdi-shield-account-outline me-1"></i>
                                        Permanência: {contract.rules.minPermanence} meses
                                    </Badge>
                                )}
                                {contract.rules?.allowedWeekDays?.length > 0 && (
                                    <Badge color="soft-secondary" className="px-2 py-1">
                                        <i className="mdi mdi-calendar-check me-1"></i>
                                        {contract.rules.allowedWeekDays.length}x p/ semana
                                    </Badge>
                                )}
                            </div>

                            {/* Estatísticas de Suspensão */}
                            {contract.rules?.allowFreeze !== false && (
                                <div className="mb-4 p-2 bg-light rounded border border-dashed">
                                    <div className="d-flex justify-content-between align-items-center small">
                                        <span className="text-muted font-size-11"><i className="mdi mdi-clock-fast me-1"></i>Pausas Usadas:</span>
                                        <span className="fw-bold font-size-11 text-dark">
                                            {contract.suspension?.totalDaysUsed || 0} / {contract.rules?.maxFreezeDays || 30} dias
                                        </span>
                                    </div>
                                    <div className="progress progress-sm mt-1" style={{ height: '4px' }}>
                                        <div
                                            className={`progress-bar ${(contract.suspension?.totalDaysUsed || 0) > (contract.rules?.maxFreezeDays || 30) * 0.8 ? 'bg-danger' : 'bg-primary'}`}
                                            style={{ width: `${Math.min(100, ((contract.suspension?.totalDaysUsed || 0) / (contract.rules?.maxFreezeDays || 30)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="d-flex gap-2">
                                <Button color="light" size="sm" className="px-3">
                                    Dados
                                </Button>

                                <div className="btn-group btn-group-sm shadow-sm">
                                    <Button color="info" outline className="border-end-0" onClick={() => onAdjustDays(contract, 'add')}>
                                        Dias+
                                    </Button>
                                    <Button color="info" outline className="border-start-0" onClick={() => onAdjustDays(contract, 'sub')}>
                                        Dias-
                                    </Button>
                                </div>

                                {isSuspended ? (
                                    <Button color="success" size="sm" className="px-3 shadow-sm" onClick={() => onReactivate(contract)}>
                                        Reativar
                                    </Button>
                                ) : (
                                    <Button color="warning" outline size="sm" className="px-3" onClick={() => onSuspend(contract)}>
                                        Suspender
                                    </Button>
                                )}

                                <Button color="primary" outline size="sm" className="px-3" onClick={() => onTransfer(contract)}>
                                    Transferir
                                </Button>

                                <Button color="danger" outline size="sm" className="px-3" onClick={() => onCancel(contract)}>
                                    Cancelar
                                </Button>

                                <Button
                                    color="secondary"
                                    outline
                                    size="sm"
                                    className="px-3"
                                    onClick={() => onPrint(contract.idSale)}
                                >
                                    <i className="mdi mdi-printer me-1"></i> Recibo
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    )
}

export default ActiveContractCard
