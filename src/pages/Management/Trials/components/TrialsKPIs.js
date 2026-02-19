import React from "react"
import { Row, Col, Card, CardBody } from "reactstrap"

const TrialsKPIs = ({ kpis }) => {
    return (
        <Row className="mb-4">
            {/* Aulas Agendadas */}
            <Col md={4}>
                <div className="d-flex align-items-center">
                    <Card className="flex-grow-1 mb-0" style={{ backgroundColor: "#f3e5f5", border: "none" }}>
                        <CardBody className="p-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 text-truncate">Aulas agendadas</p>
                                    <h4 className="mb-0 font-weight-bold" style={{ color: "#7b1fa2" }}>
                                        {kpis.totalScheduled}
                                    </h4>
                                </div>
                                <div className="avatar-sm rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center">
                                    <i className="mdi mdi-calendar-clock font-size-24" style={{ color: "#7b1fa2" }}></i>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Divisor/Seta de Conversão */}
                    <div className="mx-2 d-flex flex-column align-items-center">
                        <span className="badge rounded-pill bg-dark p-2 mb-1 text-white" style={{ minWidth: "45px" }}>
                            {kpis.attendanceRate}%
                        </span>
                        <i className="mdi mdi-arrow-right font-size-20 text-muted"></i>
                    </div>
                </div>
            </Col>

            {/* Presenças */}
            <Col md={4}>
                <div className="d-flex align-items-center">
                    <Card className="flex-grow-1 mb-0" style={{ backgroundColor: "#e8f5e9", border: "none" }}>
                        <CardBody className="p-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 text-truncate">Presenças</p>
                                    <h4 className="mb-0 font-weight-bold text-success">
                                        {kpis.totalAttended}
                                    </h4>
                                </div>
                                <div className="avatar-sm rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center">
                                    <i className="mdi mdi-account-check font-size-24 text-success"></i>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Divisor/Seta de Conversão */}
                    <div className="mx-2 d-flex flex-column align-items-center">
                        <span className="badge rounded-pill bg-dark p-2 mb-1 text-white" style={{ minWidth: "45px" }}>
                            {kpis.conversionRate}%
                        </span>
                        <i className="mdi mdi-arrow-right font-size-20 text-muted"></i>
                    </div>
                </div>
            </Col>

            {/* Vendas */}
            <Col md={4}>
                <Card className="mb-0" style={{ backgroundColor: "#e3f2fd", border: "none" }}>
                    <CardBody className="p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <p className="text-muted mb-1 text-truncate">Vendas de novos contratos</p>
                                <h4 className="mb-0 font-weight-bold text-primary">
                                    {kpis.totalConverted}
                                </h4>
                            </div>
                            <div className="avatar-sm rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center">
                                <i className="mdi mdi-cart-outline font-size-24 text-primary"></i>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    )
}

export default TrialsKPIs
