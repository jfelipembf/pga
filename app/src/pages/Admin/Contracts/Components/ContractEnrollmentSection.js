import React from "react"
import { Button, Col, Input, Label, Row } from "reactstrap"

// Preferencial: usar alias (você já usa "components/..." em outros arquivos)
import { WEEKDAY_OPTIONS, WEEKDAY_LABELS } from "constants/weekdays"

import { toggleArrayValue } from "../Utils/toggleArrayValue"

export default function ContractEnrollmentSection({ formState, updateField }) {
  const allowed = Array.isArray(formState.allowedWeekDays) ? formState.allowedWeekDays : []

  return (
    <section className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <p className="text-muted text-uppercase small mb-1">Matrícula</p>
          <h5 className="mb-0">Regras de contratação</h5>
        </div>
      </div>

      <Row className="g-3">
        <Col md="6" className="d-flex align-items-center gap-2">
          <Input
            type="switch"
            id="requiresEnrollment"
            checked={Boolean(formState.requiresEnrollment)}
            onChange={e => updateField("requiresEnrollment", e.target.checked)}
          />
          <div>
            <Label for="requiresEnrollment" className="fw-semibold mb-0">
              Exigir matrícula no momento da venda
            </Label>
            <div className="text-muted small">Desligado: matrícula pode ser feita depois.</div>
          </div>
        </Col>

        <Col md="6">
          <Label className="fw-semibold">Máximo de matrículas por semana</Label>
          <Input
            type="number"
            min="0"
            value={formState.maxWeeklyEnrollments ?? formState.weeklyLimit ?? 0}
            onChange={e => updateField("maxWeeklyEnrollments", Number(e.target.value))}
          />
          <small className="text-muted">Use 0 para ilimitado.</small>
        </Col>

        <Col md="12">
          <Label className="fw-semibold">Dias permitidos para matricular</Label>

          <div className="d-flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map(option => {
              const selected = allowed.includes(option.value)

              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  color={selected ? "primary" : "light"}
                  className="px-3"
                  onClick={() =>
                    updateField("allowedWeekDays", toggleArrayValue(allowed, option.value))
                  }
                >
                  {WEEKDAY_LABELS[option.value] || option.label}
                </Button>
              )
            })}
          </div>

          <small className="text-muted">
            Se não selecionar nenhum dia, o aluno pode se matricular em qualquer dia.
          </small>
        </Col>
      </Row>
    </section>
  )
}
