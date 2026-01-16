import React from "react"
import { Card, CardBody, CardHeader, Table, Badge, Col, Row } from "reactstrap"
import PropTypes from "prop-types"

const ClientTests = ({ tests = [] }) => {
  return (
    <Row>
      <Col xs="12">
        <Card className="shadow-sm">
          <CardHeader className="bg-white border-bottom">
            <h5 className="mb-0">Histórico de Testes</h5>
          </CardHeader>
          <CardBody>
            {tests.length === 0 ? (
              <div className="text-center py-5">
                <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                  <i className="mdi mdi-clipboard-text-off text-muted fs-4" />
                </div>
                <p className="text-muted mb-0">Nenhum teste registrado para este aluno.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Data</th>
                      <th>Teste</th>
                      <th>Tipo</th>
                      <th>Meta</th>
                      <th className="text-end">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map(test => {
                      // Formatting date safely
                      let dateStr = "--"
                      if (test.updatedAt?.seconds) {
                        dateStr = new Date(test.updatedAt.seconds * 1000).toLocaleDateString('pt-BR')
                      }

                      // isDistanceFixed (Measure Time) = testType === 'tempo'
                      // So 'tempo' means "Fixed Distance, Measure Time"

                      // Interpreting result display:
                      let resultDisplay = test.result
                      let metaDisplay = ""

                      if (test.testType === 'tempo') {
                        // Fixed Distance, result is time
                        resultDisplay = `${test.result} (Tempo)`
                        metaDisplay = test.distanceMeters ? `${test.distanceMeters}m` : ""
                      } else {
                        // Fixed Time, result is distance
                        resultDisplay = `${test.result}m`
                        metaDisplay = test.targetTime ? `${test.targetTime}` : ""
                      }

                      return (
                        <tr key={test.id}>
                          <td>{dateStr}</td>
                          <td className="fw-semibold">{test.title || "Evento de Teste"}</td>
                          <td>
                            <Badge color={test.testType === 'tempo' ? "info" : "primary"}>
                              {test.testType === 'tempo' ? "Distância Fixa" : "Tempo Fixo"}
                            </Badge>
                          </td>
                          <td>{metaDisplay || "--"}</td>
                          <td className="text-end fw-bold">{resultDisplay}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

ClientTests.propTypes = {
  tests: PropTypes.array
}

export default ClientTests
