import React from "react"
import { Col, Input, Label, Row } from "reactstrap"

export default function ContractPricingSection({ formState, updateField }) {
  return (
    <section className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <p className="text-muted text-uppercase small mb-1">Valores</p>
          <h5 className="mb-0">Cobrança padrão</h5>
        </div>
      </div>

      <Row className="g-3">
        <Col md="3">
          <Label className="fw-semibold">Valor</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formState.value || 0}
            onChange={e => updateField("value", Number(e.target.value))}
          />
        </Col>

        <Col md="3">
          <Label className="fw-semibold">Parcelamento máximo</Label>
          <Input
            type="number"
            min="1"
            value={formState.maxAmountInstallments || 1}
            onChange={e => updateField("maxAmountInstallments", Number(e.target.value))}
          />
        </Col>

        <Col md="3">
          <div />
        </Col>
      </Row>
    </section>
  )
}
