import React from "react"
import { Row, Col, Card, CardBody } from "reactstrap"
import { useDRE } from "./hooks/useDRE"
import { DREReport } from "./components/DREReport"
import moment from "moment"
import "moment/locale/pt-br"
import PageLoader from "../../../components/Common/PageLoader"
import { MONTHS } from "../../../utils/constants"

const DREPage = () => {
    document.title = "DRE Gerencial | PGA Admin"
    moment.locale('pt-br')

    const {
        transactions,
        filters,
        handleFilterChange,
        loading
    } = useDRE()


    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    const periodLabel = filters.startMonth === filters.endMonth
        ? `${MONTHS[filters.startMonth].label} / ${filters.year}`
        : `${MONTHS[filters.startMonth].label} a ${MONTHS[filters.endMonth].label} / ${filters.year}`;

    return (
        <React.Fragment>
            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h4 className="font-size-18 text-uppercase fw-bold mb-1">DRE Gerencial</h4>
                    <p className="text-muted mb-0">Análise de rentabilidade e performance operacional</p>
                </div>

                <div className="mt-3 mt-md-0 d-flex flex-wrap align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2 bg-white p-2 rounded shadow-sm border">
                        <select
                            className="form-select form-select-sm border-0 bg-transparent fw-bold"
                            value={filters.year}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>

                        <div className="border-start ps-2 d-flex align-items-center gap-1">
                            <select
                                className="form-select form-select-sm border-0 bg-transparent"
                                value={filters.startMonth}
                                onChange={(e) => handleFilterChange('startMonth', e.target.value)}
                            >
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <span className="text-muted">até</span>
                            <select
                                className="form-select form-select-sm border-0 bg-transparent"
                                value={filters.endMonth}
                                onChange={(e) => handleFilterChange('endMonth', e.target.value)}
                            >
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <Row>
                <Col lg={12}>
                    {loading ? (
                        <Card className="shadow-sm border-0 mt-4 position-relative" style={{ minHeight: '400px' }}>
                            <CardBody>
                                <PageLoader isFullScreen={false} />
                            </CardBody>
                        </Card>
                    ) : (
                        <DREReport
                            transactions={transactions}
                            periodLabel={periodLabel}
                        />
                    )}
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
