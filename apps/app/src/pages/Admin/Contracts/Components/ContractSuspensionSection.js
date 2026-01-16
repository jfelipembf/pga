import React from "react"
import { Col, Input, Label, Row } from "reactstrap"

export default function ContractSuspensionSection({ formState, updateField }) {
  return (
    <section className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <p className="text-muted text-uppercase small mb-1">Suspensão</p>
          <h5 className="mb-0">Regras de congelamento</h5>
        </div>
      </div>

      <Row className="g-3 align-items-end">
        <Col md="6">
          <Label className="fw-semibold">Permite suspender?</Label>
          <Input
            type="select"
            value={formState.allowSuspension ? "true" : "false"}
            onChange={e => updateField("allowSuspension", e.target.value === "true")}
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </Input>
        </Col>

        <Col md="6">
          <Label className="fw-semibold">Dias máximos de suspensão</Label>
          <Input
            type="number"
            min="0"
            value={formState.suspensionMaxDays || 0}
            onChange={e => updateField("suspensionMaxDays", Number(e.target.value))}
            disabled={!formState.allowSuspension}
          />
        </Col>
      </Row>
    </section>
  )
}
