import React, { useMemo } from 'react'
import { Card, CardBody, Table, Progress } from 'reactstrap'
import { formatCurrency } from '../../../../utils/format'

export const DREReport = ({ transactions, periodLabel }) => {

    const dreData = useMemo(() => {
        const data = {
            revenue: { total: 0, items: {} },
            expenses: { total: 0, items: {} },
            result: 0
        }

        transactions.forEach(t => {
            const amount = parseFloat(t.amount) || 0;
            // Normalizar categoria
            const category = t.category || (t.type === 'income' ? 'Receitas Diversas' : 'Despesas Gerais');

            if (t.type === 'income') {
                // Ignorar Suprimentos no DRE (Suprimento não é receita)
                if (category.toLowerCase().includes('suprimento')) return;

                data.revenue.total += amount;
                data.revenue.items[category] = (data.revenue.items[category] || 0) + amount;
            } else if (t.type === 'expense') {
                // Ignorar Sangrias no DRE (Sangria é transferência, não despesa - a menos que seja justificada como despesa)
                // Se description for "Sangria", geralmente é retirada. Se for pgto conta, entra.
                // Mas contabilmente, se saiu dinheiro e não é transferencia bancaria interna, é despesa ou retirada de lucro.
                // Vamos assumir TODAS expenses como redutoras por enquanto, exceto se explicito.

                data.expenses.total += amount;
                data.expenses.items[category] = (data.expenses.items[category] || 0) + amount;
            }
        });

        data.result = data.revenue.total - data.expenses.total;
        return data;
    }, [transactions]);

    // Ordenar categorias por valor
    const sortedRevenue = Object.entries(dreData.revenue.items)
        .sort(([, a], [, b]) => b - a);

    const sortedExpenses = Object.entries(dreData.expenses.items)
        .sort(([, a], [, b]) => b - a);

    const profitMargin = dreData.revenue.total > 0
        ? (dreData.result / dreData.revenue.total) * 100
        : 0;

    return (
        <Card className="shadow-sm border-0 mt-4">
            <CardBody>
                <div className="mb-4">
                    <h5 className="card-title fw-bold text-uppercase text-muted">DRE Gerencial - {periodLabel}</h5>
                </div>

                <div className="table-responsive">
                    <Table className="table-sm table-borderless align-middle mb-0">
                        <thead className="border-bottom">
                            <tr>
                                <th className="text-uppercase font-size-11 text-muted">Categoria</th>
                                <th className="text-uppercase font-size-11 text-muted text-end">Percentual</th>
                                <th className="text-uppercase font-size-11 text-muted text-end">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* RECEITAS */}
                            <tr className="bg-light">
                                <td colSpan="3" className="fw-bold text-success py-2">
                                    <i className="mdi mdi-arrow-up-circle me-1"></i> RECEITAS OPERACIONAIS
                                </td>
                            </tr>
                            {sortedRevenue.map(([cat, val]) => (
                                <tr key={cat}>
                                    <td className="ps-4">{cat}</td>
                                    <td className="text-end" style={{ width: '150px' }}>
                                        <div className="d-flex align-items-center justify-content-end gap-2">
                                            <span className="font-size-11 text-muted">{((val / dreData.revenue.total) * 100).toFixed(1)}%</span>
                                            <Progress value={(val / dreData.revenue.total) * 100} color="success" style={{ height: '4px', width: '50px' }} />
                                        </div>
                                    </td>
                                    <td className="text-end fw-medium">{formatCurrency(val)}</td>
                                </tr>
                            ))}
                            <tr className="border-top fw-bold">
                                <td className="ps-4 text-muted">TOTAL RECEITAS</td>
                                <td></td>
                                <td className="text-end text-success">{formatCurrency(dreData.revenue.total)}</td>
                            </tr>

                            {/* DESPESAS */}
                            <tr className="bg-light">
                                <td colSpan="3" className="fw-bold text-danger py-2 mt-3">
                                    <i className="mdi mdi-arrow-down-circle me-1"></i> DESPESAS E CUSTOS
                                </td>
                            </tr>
                            {sortedExpenses.map(([cat, val]) => (
                                <tr key={cat}>
                                    <td className="ps-4">{cat}</td>
                                    <td className="text-end" style={{ width: '150px' }}>
                                        <div className="d-flex align-items-center justify-content-end gap-2">
                                            <span className="font-size-11 text-muted">{dreData.revenue.total > 0 ? ((val / dreData.revenue.total) * 100).toFixed(1) : 0}%</span>
                                            <Progress value={dreData.revenue.total > 0 ? (val / dreData.revenue.total) * 100 : 0} color="danger" style={{ height: '4px', width: '50px' }} />
                                        </div>
                                    </td>
                                    <td className="text-end fw-medium">{formatCurrency(val)}</td>
                                </tr>
                            ))}
                            <tr className="border-top fw-bold">
                                <td className="ps-4 text-muted">TOTAL DESPESAS</td>
                                <td></td>
                                <td className="text-end text-danger">{formatCurrency(dreData.expenses.total)}</td>
                            </tr>

                            {/* RESULTADO FINAL */}
                            <tr className="bg-light border-top border-2 border-primary">
                                <td colSpan="2" className="fw-bold text-uppercase py-3 ps-3">
                                    Resultado Líquido do Exercício
                                    <span className="ms-2 font-size-11 badge bg-light text-dark border">Margem: {profitMargin.toFixed(1)}%</span>
                                </td>
                                <td className={`text-end fw-bold font-size-16 py-3 ${dreData.result >= 0 ? 'text-primary' : 'text-danger'}`}>
                                    {formatCurrency(dreData.result)}
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </CardBody>
        </Card>
    )
}
