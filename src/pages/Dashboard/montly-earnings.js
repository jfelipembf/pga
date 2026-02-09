import React from "react"
import { Card, CardBody, Row, CardTitle } from "reactstrap"
import DonutChart from "./DonutChart"
// import DonutChart from '../AllCharts/DonutChart';

const MonthlyEarnings = props => {
    return (
        <React.Fragment>
            <Card>
                <CardBody>
                    <CardTitle className="h4 mb-4">Mais vendidos</CardTitle>

                    <Row className="text-center mt-4">
                        <div className="col-6">
                            <h5 className="font-size-20">R$56241</h5>
                            <p className="text-muted">Anual</p>
                        </div>
                        <div className="col-6">
                            <h5 className="font-size-20">R$23651</h5>
                            <p className="text-muted">Mensal</p>
                        </div>
                    </Row>
                    <div dir="ltr">
                        {/* <DonutChart /> */}
                        <DonutChart />
                    </div>

                </CardBody>
            </Card>
        </React.Fragment>
    )

}

export default MonthlyEarnings
