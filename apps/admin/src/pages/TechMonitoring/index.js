import React from "react"
import { Container, Row, Col, Card, CardBody, CardTitle } from "reactstrap"
import { usePerformanceLogs } from "./hooks/usePerformanceLogs"
import PerformanceStats from "./components/PerformanceStats"
import SlowFunctionsChart from "./components/SlowFunctionsChart"
import LogsTable from "./components/LogsTable"

const TechMonitoring = () => {
    const { logs, stats, loading } = usePerformanceLogs()

    return (
        <div className="page-content">
            <Container fluid>
                <div className="page-title-box">
                    <h4 className="mb-0">Monitoramento Técnico</h4>
                    <p className="text-muted">Saúde do sistema, performance e gargalos em tempo real.</p>
                </div>

                <Row>
                    <Col xl="4">
                        <PerformanceStats stats={stats} />
                    </Col>
                    <Col xl="8">
                        <Card>
                            <CardBody>
                                <CardTitle className="mb-4">Top Funções Mais Lentas (Média)</CardTitle>
                                <SlowFunctionsChart logs={logs} />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col xs="12">
                        <LogsTable logs={logs} loading={loading} />
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default TechMonitoring
