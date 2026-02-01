import React from 'react'
import { Table, Badge } from 'reactstrap'
import { formatCurrency } from '../../../../utils/format'
import { formatDate } from '../../../../utils/date'

export const CashierTransactionsTable = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-5 border rounded bg-light border-dashed mt-4">
                <i className="mdi mdi-file-document-outline fs-1 text-muted opacity-25 mb-2 d-block"></i>
                <p className="text-muted mb-0">Nenhuma movimentação registrada nesta sessão.</p>
            </div>
        )
    }

    return (
        <div className="table-responsive mt-4">
            <h5 className="font-size-14 text-uppercase fw-bold text-muted mb-3">Extrato de Movimentações</h5>
            <Table className="table-hover table-nowrap align-middle mb-0 bg-white shadow-sm rounded">
                <thead className="table-light">
                    <tr>
                        <th>Horário</th>
                        <th>Descrição</th>
                        <th>Tipo</th>
                        <th>Forma Pagto</th>
                        <th className="text-end">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t) => (
                        <tr key={t.id}>
                            <td className="text-muted" style={{ width: '100px' }}>
                                {t.createdAt?.toDate ? formatDate(t.createdAt.toDate(), 'HH:mm') : formatDate(new Date(t.date), 'HH:mm')}
                            </td>
                            <td>
                                <div className="fw-bold text-dark">{t.description}</div>
                                {t.saleNumber && <small className="text-muted">Venda #{t.saleNumber}</small>}
                            </td>
                            <td>
                                <Badge
                                    color={t.type === 'income' ? 'success' : 'danger'}
                                    className={t.type === 'income' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}
                                >
                                    {t.type === 'income' ? 'ENTRADA' : 'SAÍDA'}
                                </Badge>
                            </td>
                            <td>
                                <span className="text-uppercase font-size-11 badge bg-light text-dark border">
                                    {t.method || 'Outros'}
                                </span>
                            </td>
                            <td className={`text-end fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    )
}
