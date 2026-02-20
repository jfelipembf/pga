import React from 'react'
import { Table, Button } from 'reactstrap'
import { formatDate } from '../../../../../utils/date'
import { formatCurrency } from '../../../../../utils/format'
import StatusBadge from '../../../../../components/Common/StatusBadge'

const ContractHistoryTable = ({ contracts, onPrint, onShowDetails }) => {
    return (
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
                    {contracts.length > 0 ? (
                        contracts.map((contract) => (
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
                                            <small className="text-muted">{contract.idClientContract}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>{formatDate(contract.startDate)}</td>
                                <td>{formatDate(contract.endDate)}</td>
                                <td>
                                    <div className="fw-bold text-dark">
                                        {contract.isScholarship ? (
                                            <span className="text-success small"><i className="mdi mdi-school me-1"></i>Bolsista</span>
                                        ) : formatCurrency(contract.value)}
                                    </div>
                                    {contract.discount > 0.01 && !contract.isScholarship && (
                                        <div className="text-danger font-size-10 fw-medium">Desc: {formatCurrency(contract.discount)}</div>
                                    )}
                                </td>
                                <td>
                                    <StatusBadge status={contract.status} />
                                </td>
                                <td className="text-end pe-4">
                                    <div className="d-flex justify-content-end gap-2">
                                        <Button
                                            color="link"
                                            className="text-secondary p-0"
                                            title="Imprimir Recibo Original"
                                            onClick={() => onPrint(contract.idSale)}
                                        >
                                            <i className="mdi mdi-printer fs-5"></i>
                                        </Button>
                                        <Button
                                            color="link"
                                            className="text-primary p-0"
                                            onClick={() => onShowDetails(contract)}
                                        >
                                            <i className="mdi mdi-eye-outline fs-5"></i>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center py-4 text-muted border-0">
                                Não há outros registros de contratos.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    )
}

export default ContractHistoryTable
