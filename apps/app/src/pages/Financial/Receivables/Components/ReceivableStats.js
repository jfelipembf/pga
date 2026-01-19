import React from "react"
import { Card, CardBody, Col, Row } from "reactstrap"

const StatCard = ({ title, value, color, icon }) => (
    <Card className="mini-stats-wid">
        <CardBody>
            <div className="d-flex">
                <div className="flex-grow-1">
                    <p className="text-muted fw-medium">{title}</p>
                    <h4 className="mb-0">
                        {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        }).format(value)}
                    </h4>
                </div>
                <div className="flex-shrink-0 align-self-center">
                    <div className={`avatar-sm rounded-circle bg-${color}-subtle`}>
                        <span className={`avatar-title rounded-circle bg-${color}-subtle text-${color} font-size-24`}>
                            <i className={icon}></i>
                        </span>
                    </div>
                </div>
            </div>
        </CardBody>
    </Card>
)

const ReceivableStats = ({ stats }) => {
    return (
        <Row>
            <Col md="4">
                <StatCard
                    title="A Receber (Período)"
                    value={stats.toReceive}
                    color="warning"
                    icon="bx bx-time-five"
                />
            </Col>
            <Col md="4">
                <StatCard
                    title="Vencido"
                    value={stats.overdue}
                    color="danger"
                    icon="bx bx-error-circle"
                />
            </Col>
            <Col md="4">
                <StatCard
                    title="Recebido (Pago)"
                    value={stats.paid}
                    color="success"
                    icon="bx bx-check-circle"
                />
            </Col>
        </Row>
    )
}

export default ReceivableStats
