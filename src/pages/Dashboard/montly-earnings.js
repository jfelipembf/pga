import React from "react"
import { Card, CardBody, Row, CardTitle, Col } from "reactstrap"
import DonutChart from "./DonutChart"
import moment from "moment"

const MonthlyEarnings = ({ data }) => {
    // Pegar os top 2 para os mini-cards do topo
    const topPlans = data?.labels?.slice(0, 2).map((label, index) => ({
        label,
        count: data.series[index]
    })) || [];

    return (
        <Card className="h-100">
            <CardBody>
                <CardTitle className="h4 mb-4">Mais vendidos</CardTitle>

                <Row className="text-center mt-4">
                    {topPlans.length > 0 ? topPlans.map((plan, idx) => (
                        <Col key={idx} xs="6">
                            <h5 className="font-size-20">{plan.count}</h5>
                            <p className="text-muted text-truncate">{plan.label}</p>
                        </Col>
                    )) : (
                        <Col xs="12">
                            <p className="text-muted">Sem vendas no mês</p>
                        </Col>
                    )}
                </Row>

                <div className="mt-4" dir="ltr">
                    <DonutChart
                        labels={data?.labels}
                        series={data?.series}
                        totalLabel={moment().format('MMMM')}
                        totalValue={String(data?.totalCount || 0)}
                    />
                </div>
            </CardBody>
        </Card>
    )
}

export default MonthlyEarnings
