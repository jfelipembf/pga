import React from "react"
import { Button, Card, CardBody, CardHeader, Col, Form, FormGroup, Input, Label, Row, Table } from "reactstrap"
import ButtonLoader from "../../../../components/Common/ButtonLoader"

const AcquirerForm = ({
  value,
  onChange,
  onSave,
  onClear,
  onToggleActive,
  onToggleBrand,
  onToggleAnticipate,
  onInstallmentChange,
  onAddInstallment,
  onRemoveInstallment,
  brandOptions,
  saving = false,
}) => {
  const formState = value || {}

  const updateField = (field, transform = v => v) => e => {
    const next = { ...formState, [field]: transform(e.target.value) }
    onChange?.(next)
  }

  return (
    <Card className="shadow-sm h-100">
      <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="mb-1">{formState.name ? formState.name : "Nova adquirente"}</h5>
          <p className="text-muted mb-0 small">Informe as taxas e bandeiras aceitas pela adquirente.</p>
        </div>
        <div className="d-flex gap-2">
          <Button color="light" onClick={onClear} disabled={saving}>
            Limpar
          </Button>
          <ButtonLoader
            color="primary"
            onClick={() => onSave?.(formState)}
            loading={saving}
          >
            Salvar
          </ButtonLoader>
        </div>
      </CardHeader>
      <CardBody>
        <Form>
          <Row className="g-3">
            <Col md="8">
              <FormGroup>
                <Label>Nome</Label>
                <Input value={formState.name || ""} onChange={updateField("name")} required />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Status</Label>
                <div className="form-check form-switch mt-2">
                  <Input type="switch" id="acquirerStatus" checked={!formState.inactive} onChange={onToggleActive} />
                  <Label className="form-check-label ms-2" htmlFor="acquirerStatus">
                    {formState.inactive ? "Inativo" : "Ativo"}
                  </Label>
                </div>
              </FormGroup>
            </Col>

            <Col md="12">
              <Label className="d-block">Bandeiras</Label>
              <div className="d-flex flex-wrap gap-3">
                {brandOptions.map(brand => (
                  <div className="form-check" key={brand.id}>
                    <Input
                      type="checkbox"
                      id={`brand-${brand.id}`}
                      checked={(formState.brands || []).includes(brand.id)}
                      onChange={() => onToggleBrand?.(brand.id)}
                    />
                    <Label className="form-check-label ms-1" htmlFor={`brand-${brand.id}`}>
                      {brand.label}
                    </Label>
                  </div>
                ))}
                {formState.brands?.includes("others") && (
                  <Input
                    className="mt-2"
                    placeholder="Outra bandeira"
                    value={formState.otherBrandName || ""}
                    onChange={updateField("otherBrandName")}
                  />
                )}
              </div>
            </Col>

            <Col md="6">
              <FormGroup>
                <Label>Taxa débito (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.debitFeePercent || 0}
                  onChange={updateField("debitFeePercent", Number)}
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
                  value={formState.creditOneShotFeePercent || 0}
                  onChange={updateField("creditOneShotFeePercent", Number)}
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
                      id="anticipateSwitch"
                      checked={formState.anticipateReceivables}
                      onChange={onToggleAnticipate}
                    />
                    <Label className="form-check-label ms-2" htmlFor="anticipateSwitch">
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
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formState.installmentFees || []).map((fee, index) => (
                          <tr key={`${fee.installments}-${index}`}>
                            <td style={{ width: "30%" }}>
                              <Input
                                type="number"
                                min="1"
                                value={fee.installments}
                                onChange={e => onInstallmentChange?.(index, "installments", e.target.value)}
                              />
                            </td>
                            <td style={{ width: "40%" }}>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={fee.feePercent}
                                onChange={e => onInstallmentChange?.(index, "feePercent", e.target.value)}
                              />
                            </td>
                            <td className="text-end">
                              <Button
                                color="link"
                                className="text-danger px-2"
                                onClick={() => onRemoveInstallment?.(index)}
                                disabled={(formState.installmentFees || []).length <= 1}
                              >
                                <i className="mdi mdi-trash-can-outline" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className="d-flex justify-content-end p-3 pt-0">
                    <Button color="light" size="sm" onClick={onAddInstallment}>
                      <i className="mdi mdi-plus" /> Adicionar parcela
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default AcquirerForm
