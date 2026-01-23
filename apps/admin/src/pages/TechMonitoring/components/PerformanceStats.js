import React from "react"
import { Card, CardBody, Row, Col } from "reactstrap"

const StatItem = ({ title, value, subtext, color = "primary" }) => (
    <div className={`text-${color} mb-3`}>
        <h5 className="mb-0">{value}</h5>
        <div className="text-muted font-size-12">{title}</div>
        {subtext && <div className="font-size-10 opacity-75">{subtext}</div>}
    </div>
)

const PerformanceStats = ({ stats }) => {
    return (
        <Card>
            <CardBody>
                <h4 className="card-title mb-4">Health Score</h4>
                <Row className="text-center">
                    <Col xs="6">
                        <StatItem
                            title="Latência Média"
                            value={`${stats.avgDuration}ms`}
                            color={stats.avgDuration > 1000 ? "danger" : "success"}
                        />
                    </Col>
                    <Col xs="6">
                        <StatItem
                            title="Taxa de Erro"
                            value={`${stats.errorRate}%`}
                            color={stats.errorRate > 1 ? "danger" : "success"}
                        />
                    </Col>
                    <Col xs="6">
                        <StatItem
                            title="Requisições Lentas"
                            value={`${stats.slowRate}%`}
                            subtext="> 2000ms"
                            color={stats.slowRate > 5 ? "warning" : "info"}
                        />
                    </Col>
                    <Col xs="6">
                        <StatItem
                            title="Total Calls"
                            value={stats.totalCalls}
                            color="dark"
                        />
                    </Col>
                </Row>
            </CardBody>
        </Card>
    )
}

export default PerformanceStats
