import React from "react"
import { Card, CardBody, Row, CardTitle } from "reactstrap"
import DonutChart from "./DonutChart"

const CONTRACT_SERIES = [3, 32, 15]
const CONTRACT_LABELS = ["Anual", "Semestral", "Mensal"]

const formatContracts = value => `${value} contratos`

const MonthlyEarnings = () => {
  return (
    <React.Fragment>
      <Card>
        <CardBody>
          <CardTitle className="h4 mb-4">Contratos</CardTitle>

          <Row className="text-center mt-4">
            <div className="col-4">
              <h5 className="font-size-20">{formatContracts(CONTRACT_SERIES[0])}</h5>
              <p className="text-muted">Planos</p>
            </div>
          </Row>
          <div dir="ltr">
            <DonutChart series={CONTRACT_SERIES} labels={CONTRACT_LABELS} totalLabel="Total vendido" />
          </div>
        </CardBody>
      </Card>
    </React.Fragment>
  )
}

export default MonthlyEarnings
