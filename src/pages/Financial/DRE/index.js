import React from "react"
import { Row, Col, Card, CardBody, Button } from "reactstrap"
import { useDRE } from "./hooks/useDRE"
import { CashFlowDRE } from "../CashFlow/components/CashFlowDRE"
import PageLoader from "../../../components/Common/PageLoader"

/**
 * Página de DRE Gerencial (Demonstrativo de Resultado do Exercício)
 * Focada na análise de rentabilidade e performance do negócio.
 */
const DREPage = () => {
    document.title = "DRE Gerencial | PGA Admin"

    const {
        transactions,
        summary,
        loading,
        period,
        setPeriod
    } = useDRE()

    const formatVal = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);


    if (loading && transactions.length === 0) return <PageLoader />

    return (
        <React.Fragment>
            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h4 className="font-size-18 text-uppercase fw-bold mb-1">DRE Gerencial</h4>
                    <p className="text-muted mb-0">Análise de rentabilidade e performance operacional</p>
                </div>

                <div className="mt-3 mt-md-0 d-flex align-items-center gap-4">
                    <div className="text-end d-none d-lg-block border-end pe-4">
                        <span className="d-block font-size-10 text-muted text-uppercase fw-bold">Receitas</span>
                        <h5 className="m-0 text-success font-size-15 fw-bold">{formatVal(summary?.receitas)}</h5>
                    </div>
                    <div className="text-end d-none d-lg-block border-end pe-4">
                        <span className="d-block font-size-10 text-muted text-uppercase fw-bold">Despesas</span>
                        <h5 className="m-0 text-danger font-size-15 fw-bold">{formatVal(summary?.despesas)}</h5>
                    </div>
                    <div className="text-end me-3">
                        <span className="d-block font-size-10 text-muted text-uppercase fw-bold">Resultado</span>
                        <h5 className={`m-0 font-size-16 fw-bold ${summary?.lucro >= 0 ? 'text-primary' : 'text-danger'}`}>{formatVal(summary?.lucro)}</h5>
                    </div>

                    <div className="btn-group shadow-sm rounded">
                        <Button color="light" size="sm" className="px-3" active={period === 'day'} onClick={() => setPeriod('day')}>Hoje</Button>
                        <Button color="light" size="sm" className="px-3" active={period === 'week'} onClick={() => setPeriod('week')}>Semana</Button>
                        <Button color="white" size="sm" className="px-3 border-start" active={period === 'month'} onClick={() => setPeriod('month')}>Este Mês</Button>
                    </div>
                </div>
            </div>

            <Row>
                <Col lg={12}>
                    <CashFlowDRE
                        transactions={transactions}
                        periodLabel={period === 'day' ? 'Hoje' : period === 'week' ? 'Última Semana' : 'Este Mês'}
                    />
                </Col>
            </Row>

            {/* DICAS CONTÁBEIS (FOOTER) */}
            <Row className="mt-4">
                <Col md={4}>
                    <Card className="bg-primary text-white-50 shadow-none border-0 overflow-hidden">
                        <CardBody>
                            <div className="d-flex align-items-center">
                                <div className="avatar-md me-3 flex-shrink-0">
                                    <span className="avatar-title rounded-circle bg-white text-primary font-size-24">
                                        <i className="mdi mdi-lightbulb-on-outline"></i>
                                    </span>
                                </div>
                                <div>
                                    <h5 className="font-size-14 text-white">Dica de Performance</h5>
                                    <p className="mb-0">Acompanhe a Margem Líquida para garantir a saúde do negócio.</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card className="border-0 shadow-sm">
                        <CardBody>
                            <h5 className="font-size-14 mb-3 fw-bold">Entendendo seu DRE</h5>
                            <p className="mb-0 text-muted">
                                Este relatório agrupa todas as suas <strong>Receitas Operacionais</strong> e desconta as <strong>Despesas e Custos</strong> do período.
                                Diferente do Fluxo de Caixa, o DRE foca no quanto sobrou "em mãos" após todos os compromissos, servindo de bússola para sua rentabilidade.
                            </p>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default DREPage
