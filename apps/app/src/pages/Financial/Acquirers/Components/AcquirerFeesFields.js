import React from "react"
import { Button, Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row, Table } from "reactstrap"

const AcquirerFeesFields = ({
  values,
  onChange,
  onInstallmentChange,
  onAddInstallment,
  onRemoveInstallment,
  onToggleAnticipate,
  readOnly = false
}) => {
  return (
    <Row className="g-3">
      <Col md="6">
        <FormGroup>
          <Label>Taxa débito (%)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.debitFeePercent ?? 0}
            onChange={e => onChange("debitFeePercent", Number(e.target.value))}
            disabled={readOnly}
          />
        </FormGroup>
      </Col>
      <Col md="6">
        <FormGroup>
          <Label>Taxa crédito à vista (%)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.creditOneShotFeePercent ?? 0}
            onChange={e => onChange("creditOneShotFeePercent", Number(e.target.value))}
            disabled={readOnly}
          />
        </FormGroup>
      </Col>

      <Col md="6">
        <FormGroup>
          <Label>Prazo de Recebimento (Dias)</Label>
          <Input
            type="number"
            min="0"
            value={values.receiptDays ?? 1}
            onChange={e => onChange("receiptDays", Number(e.target.value))}
            disabled={readOnly}
          />
        </FormGroup>
      </Col>
      <Col md="6">
        <FormGroup>
          <Label>Taxa extra de Antecipação (%)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.anticipationFeePercent ?? 0}
            onChange={e => onChange("anticipationFeePercent", Number(e.target.value))}
            disabled={readOnly}
          />
        </FormGroup>
      </Col>

      <Col md="12">
        <Card className="border">
          <CardHeader className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-0">Parcelado</h6>
              <small className="text-muted">Configure taxas por número de parcelas.</small>
            </div>
            <div className="form-check form-switch">
              <Input
                type="switch"
                id={`anticipateSwitch-${Math.random()}`} // ID único para evitar conflitos se tiver múltiplos
                checked={!!values.anticipateReceivables}
                onChange={onToggleAnticipate}
                disabled={readOnly}
              />
              <Label className="form-check-label ms-2">
                Antecipar recebíveis
              </Label>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Parcelas</th>
                    <th>Taxa (%)</th>
                    {!readOnly && <th className="text-end">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {(values.installmentFees || []).map((fee, index) => (
                    <tr key={`${fee.installments}-${index}`}>
                      <td style={{ width: "30%" }}>
                        <Input
                          type="number"
                          min="1"
                          value={fee.installments}
                          onChange={e => onInstallmentChange?.(index, "installments", Number(e.target.value))}
                          disabled={readOnly}
                        />
                      </td>
                      <td style={{ width: "40%" }}>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={fee.feePercent}
                          onChange={e => onInstallmentChange?.(index, "feePercent", Number(e.target.value))}
                          disabled={readOnly}
                        />
                      </td>
                      {!readOnly && (
                        <td className="text-end">
                          <Button
                            color="link"
                            className="text-danger px-2"
                            onClick={() => onRemoveInstallment?.(index)}
                            disabled={(values.installmentFees || []).length <= 1}
                          >
                            <i className="mdi mdi-trash-can-outline" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {!readOnly && (
              <div className="d-flex justify-content-end p-3 pt-0">
                <Button color="light" size="sm" onClick={onAddInstallment}>
                  <i className="mdi mdi-plus" /> Adicionar parcela
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default AcquirerFeesFields
