import React, { useMemo } from 'react';
import { Row, Col, Table } from 'reactstrap';
import { formatCurrency } from '../../../../utils/format';
import { formatDate } from '../../../../utils/date';
import logo from '../../../../assets/images/pgaLogo.png'; // Ajuste o caminho se necessário

const CashierPrintTemplate = ({ summary, transactions, user, session }) => {

    // Calcular totais por método
    const totals = useMemo(() => {
        const acc = {
            dinheiro: 0,
            pix: 0,
            cartao_credito: 0,
            cartao_debito: 0,
            others: 0,
            withdrawals: 0
        };

        (transactions || []).forEach(t => {
            if (t.type === 'expense') {
                acc.withdrawals += Number(t.amount || 0);
            } else {
                const method = t.method || 'others';
                if (acc[method] !== undefined) {
                    acc[method] += Number(t.amount || 0);
                } else {
                    acc.others += Number(t.amount || 0);
                }
            }
        });

        return acc;
    }, [transactions]);

    const today = new Date();

    return (
        <div className="d-none d-print-block p-4" style={{ backgroundColor: '#fff', color: '#000' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <div>
                    <img src={logo} alt="Logo" height="80" className="mb-2" />
                    <h4 className="mb-0 text-uppercase fw-bold">
                        {session?.isConsolidated ? 'Relatório Geral de Caixa' : 'Fechamento de Caixa'}
                    </h4>
                </div>
                <div className="text-end">
                    <p className="mb-0 fw-bold">Data: {formatDate(today, 'full')}</p>
                    <p className="mb-0">
                        {session?.isConsolidated ? 'Operadores: TODOS' : `Consultor: ${session?.userName || user?.displayName || 'Usuário'}`}
                    </p>
                    {!session?.isConsolidated && (
                        <p className="mb-0 text-muted font-size-12">ID Sessão: {session?.id?.substring(0, 8)}</p>
                    )}
                </div>
            </div>

            {/* Resumo de Totais (Topo - Conforme solicitado) */}
            {/* Resumo Unificado na Lista */}
            <div className="mb-5">
                <h5 className="fw-bold text-uppercase border-bottom border-dark pb-2 mb-3">Resumo Financeiro</h5>

                <div className="d-flex justify-content-between mb-2">
                    <span className="fw-bold">Saldo Inicial:</span>
                    <span className="fw-bold">{formatCurrency(summary?.openingBalance || 0)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2 mt-3">
                    <span className="fw-bold">Total Entradas (Vendas):</span>
                    <span className="fw-bold">{formatCurrency(summary?.totalIncome || 0)}</span>
                </div>

                {/* Breakdown by Method (Indented) */}
                <div className="ps-4 mb-3 border-start border-dark ms-2">
                    <div className="d-flex justify-content-between mb-1">
                        <span>Dinheiro:</span>
                        <span>{formatCurrency(totals.dinheiro)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <span>PIX:</span>
                        <span>{formatCurrency(totals.pix)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <span>Cartão Crédito:</span>
                        <span>{formatCurrency(totals.cartao_credito)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <span>Cartão Débito:</span>
                        <span>{formatCurrency(totals.cartao_debito)}</span>
                    </div>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span className="fw-bold">Total Saídas:</span>
                    <span className="fw-bold">-{formatCurrency(summary?.totalExpenses || 0)}</span>
                </div>

                <hr className="border-dark my-3" />

                <div className="d-flex justify-content-between mb-0 fs-5">
                    <span className="fw-bold text-uppercase">Saldo Final:</span>
                    <span className="fw-bold border border-dark px-3">{formatCurrency((Number(summary?.openingBalance || 0) + Number(summary?.totalIncome || 0)) - Number(summary?.totalExpenses || 0))}</span>
                </div>
            </div>

            {/* Extrato Simplificado (Opcional, mas útil para conferência) */}
            <div className="mb-5">
                <h5 className="fw-bold text-uppercase mb-3">Extrato de Movimentações</h5>
                <Table className="table-sm table-bordered border-dark" style={{ fontSize: '12px' }}>
                    <thead className="table-light border-dark">
                        <tr>
                            <th>Hora</th>
                            <th>Operador</th>
                            <th>Cliente</th>
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Forma</th>
                            <th className="text-end">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(transactions || []).map((t, idx) => (
                            <tr key={idx}>
                                <td>{t.createdAt?.toDate ? formatDate(t.createdAt.toDate(), 'time') : formatDate(new Date(t.date), 'time')}</td>
                                <td>{t.userName?.split(' ')[0] || '-'}</td>
                                <td>{t.clientName || '-'}</td>
                                <td>{t.description} {t.saleNumber && `(#${t.saleNumber})`}</td>
                                <td>{t.type === 'income' ? 'Entrada' : 'Saída'}</td>
                                <td>{t.method || '-'}</td>
                                <td className="text-end">{formatCurrency(t.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* Espaço para Assinatura (Fundo) */}
            <div className="mt-5 pt-5">
                <Row className="mt-5">
                    <Col xs="6" className="text-center">
                        <div className="border-top border-dark w-75 mx-auto pt-2">
                            <p className="mb-0 fw-bold">{session?.userName || 'Consultor'}</p>
                            <p className="text-muted small">Assinatura do Responsável</p>
                        </div>
                    </Col>
                    <Col xs="6" className="text-center">
                        <div className="border-top border-dark w-75 mx-auto pt-2">
                            <p className="mb-0 fw-bold">Gerente / Supervisor</p>
                            <p className="text-muted small">Conferência</p>
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="text-center mt-5 text-muted small">
                <p>Impressão gerada em {formatDate(today, 'full')}</p>
            </div>
        </div>
    );
};

export default CashierPrintTemplate;
