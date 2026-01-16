import React from "react"
import { Col, Input, Label, Row } from "reactstrap"
import { DURATION_TYPES } from "../Constants/contractOptions"

export default function ContractGeneralSection({ formState, updateField }) {
  return (
    <section className="mb-4">
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <p className="text-muted text-uppercase small mb-1">Informações gerais</p>
          <h5 className="mb-0">Identificação do plano</h5>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Input
            type="switch"
            id="contractStatus"
            checked={(formState.status || "active") === "active"}
            onChange={e => updateField("status", e.target.checked ? "active" : "inactive")}
          />
          <div>
            <Label for="contractStatus" className="fw-semibold mb-0">
              Contrato ativo
            </Label>
            <div className="text-muted small">Inativos não aparecem nas vendas.</div>
          </div>
        </div>
      </div>

      <Row className="g-3 align-items-center">
        <Col md="6">
          <Label className="fw-semibold">Nome interno</Label>
          <Input
            value={formState.title || ""}
            onChange={e => updateField("title", e.target.value)}
            placeholder="Ex.: Premium 12M"
          />
        </Col>

        <Col md="3">
          <Label className="fw-semibold">Duração</Label>
          <Input
            type="number"
            min="0"
            value={formState.duration || 0}
            onChange={e => updateField("duration", Number(e.target.value))}
          />
        </Col>

        <Col md="3">
          <Label className="fw-semibold">Categoria de duração</Label>
          <Input
            type="select"
            value={formState.durationType || "Meses"}
            onChange={e => updateField("durationType", e.target.value)}
          >
            {DURATION_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Input>
        </Col>

        <Col md="3">
          <Label className="fw-semibold">Permanência mínima</Label>
          <Input
            type="number"
            min="0"
            value={formState.minPeriodStayMembership || 0}
            onChange={e => updateField("minPeriodStayMembership", Number(e.target.value))}
          />
          <small className="text-muted">Em meses</small>
        </Col>
      </Row>
    </section>
  )
}
