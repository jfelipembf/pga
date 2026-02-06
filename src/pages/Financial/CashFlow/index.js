import React, { useRef, useCallback } from "react"
import { Row, Col, Card, CardBody, CardTitle, Button, Input } from "reactstrap"
import BasicTable from "../../../components/Common/BasicTable"
import Miniwidget from "../../Dashboard/Miniwidget"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useCashFlow } from "./hooks/useCashFlow"
import { formatCurrency } from "../../../utils/format"
import { formatDate } from "../../../utils/date"
import PageLoader from "../../../components/Common/PageLoader"
import { PAYMENT_METHOD_LABELS } from "../../../utils/constants"
import "flatpickr/dist/themes/material_blue.css"
import Flatpickr from "react-flatpickr"
import { Portuguese } from "flatpickr/dist/l10n/pt.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const chartOptions = {
    responsive: true,
    plugins: {
        legend: { position: 'top' },
    },
    scales: {
        y: { beginAtZero: true }
    }
}

const CashFlowPage = () => {
    document.title = "Fluxo de Caixa | Lexa Admin"

    const {
        transactions,
        loading,
        period,
        setPeriod,
        customDateRange,
        setCustomDateRange,
        totals,
        chartData,
        handleLoadMore,
        hasMore,
        bankAccounts,
        filterBankAccount,
        setFilterBankAccount
    } = useCashFlow()

    // Observer Infinite Scroll
    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                handleLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, handleLoadMore]);

    const columns = React.useMemo(() => [
        {
            label: "Data",
            key: "date",
            render: (tx) => formatDate(tx.date)
        },
        {
            label: "Descrição",
            key: "description",
            render: (tx) => <span className="fw-semibold">{tx.description}</span>
        },
        {
            label: "Categoria",
            key: "category",
            render: (tx) => <span className="text-capitalize">{tx.category || 'Geral'}</span>
        },
        {
            label: "Método",
            key: "method",
            render: (tx) => (
                <span className="text-uppercase">
                    {PAYMENT_METHOD_LABELS[tx.method] || tx.method || '-'}
                </span>
            )
        },
        {
            label: "Valor",
            key: "amount",
            render: (tx) => (
                <div className={`text-end fw-bold ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                </div>
            )
        }
    ], []);

    if (loading && transactions.length === 0) return <PageLoader />

    return (
        <React.Fragment>
            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div className="mb-3 mb-md-0">
                    <h4 className="font-size-18 text-uppercase fw-bold m-0">Fluxo de Caixa</h4>
                    <p className="text-muted mb-0">Monitoramento de entradas e saídas operacionais</p>
                </div>

                <div className="d-flex align-items-center flex-wrap gap-2">

                    {/* Filtro de Conta */}
                    <div style={{ minWidth: '200px' }}>
                        <Input
                            type="select"
                            value={filterBankAccount}
                            onChange={(e) => setFilterBankAccount(e.target.value)}
                            className="shadow-sm"
                            style={{ height: '38px' }}
                        >
                            <option value="all">Todas as Contas</option>
                            {bankAccounts?.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </Input>
                    </div>

                    <Button color={period === 'day' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('day')}>Hoje</Button>
                    <Button color={period === 'week' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('week')}>Semana</Button>
                    <Button color={period === 'month' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('month')}>Mês</Button>

                    <Button color={period === 'custom' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('custom')} title="Personalizado">
                        <i className="mdi mdi-calendar"></i>
                    </Button>

                    {period === 'custom' && (
                        <div className="d-flex align-items-center gap-2 ms-2">
                            <div style={{ width: '130px' }}>
                                <Flatpickr
                                    className="form-control"
                                    value={customDateRange.start}
                                    options={{
                                        dateFormat: "d/m/Y",
                                        locale: Portuguese,
                                        maxDate: "today"
                                    }}
                                    onChange={(dates) => {
                                        if (dates.length > 0) {
                                            setCustomDateRange(prev => ({ ...prev, start: dates[0] }))
                                        }
                                    }}
                                    placeholder="Início"
                                />
                            </div>
                            <span className="text-muted fw-bold">-</span>
                            <div style={{ width: '130px' }}>
                                <Flatpickr
                                    className="form-control"
                                    value={customDateRange.end}
                                    options={{
                                        dateFormat: "d/m/Y",
                                        locale: Portuguese,
                                        maxDate: "today",
                                        minDate: customDateRange.start // Opcional: impedir fim antes do início
                                    }}
                                    onChange={(dates) => {
                                        if (dates.length > 0) {
                                            setCustomDateRange(prev => ({ ...prev, end: dates[0] }))
                                        }
                                    }}
                                    placeholder="Fim"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RESUMO (CARDS) */}
            <Miniwidget
                colSize={4}
                reports={[
                    { title: "Entradas", iconClass: "arrow-up-bold", total: formatCurrency(totals.income), average: "No período", badgecolor: "success" },
                    { title: "Saídas", iconClass: "arrow-down-bold", total: formatCurrency(totals.expense), average: "No período", badgecolor: "danger" },
                    { title: "Saldo Líquido", iconClass: "scale-balance", total: formatCurrency(totals.balance), average: "Resultado", badgecolor: "info" },
                ]} />

            {/* GRÁFICO */}
            <Row className="mb-4">
                <Col lg={12}>
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <CardTitle className="mb-4 fw-bold text-uppercase font-size-13 text-muted">Movimentação Financeira (Últimos 7 dias)</CardTitle>
                            <div style={{ height: '300px' }}>
                                <Line data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* TABELA DE LANÇAMENTOS */}
            <Row>
                <Col lg={12}>
                    <h5 className="font-size-14 mb-3 text-uppercase fw-bold text-muted">Últimos Lançamentos</h5>
                    <BasicTable
                        columns={columns}
                        data={transactions}
                        loading={loading}
                        searchKeys={["description", "category", "method"]}
                        searchPlaceholder="Buscar lançamentos..."
                        hideNew={true}
                    />

                    {/* Infinite Scroll Sentinel */}
                    {hasMore && (
                        <div ref={lastElementRef} className="text-center p-3">
                            {loading && (
                                <div>
                                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                    <small className="text-muted">Carregando mais...</small>
                                </div>
                            )}
                        </div>
                    )}
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default CashFlowPage
