import React from "react"
import PropTypes from "prop-types"
import { Button, FormGroup, Label, Input, Row, Col } from "reactstrap"

import { WEEKDAY_OPTIONS, WEEKDAY_LABELS, WEEKDAY_SHORT_LABELS } from "constants/weekdays"
import ButtonLoader from "components/Common/ButtonLoader"
import { useScheduleFormHandlers } from "./Hooks/useScheduleFormHandlers"

const ScheduleForm = ({
  values = {},
  errors = {},
  touched = {},
  handleChange,
  setFieldValue = () => { },
  activities = [],
  instructors = [],
  areas = [],
  disabled = false,
  onSave = () => { },
  onDelete,
  saving = false,
}) => {
  const {
    currentWeekdays,
    handleStartTimeChange,
    handleDurationChange,
    handleWeekdayToggle,
  } = useScheduleFormHandlers({ values, disabled, handleChange, setFieldValue })

  return (
    <div className="schedule-form">
      <Row className="g-3">
        <Col md="6">
          <FormGroup>
            <Label>Atividade</Label>
            <Input
              type="select"
              name="idActivity"
              value={values.idActivity}
              onChange={handleChange}
              disabled={Boolean(disabled)}
              invalid={Boolean(touched.idActivity && errors.idActivity)}
            >
              <option value="">Selecione</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name || activity.id}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label>Instrutor</Label>
            <Input
              type="select"
              name="idStaff"
              value={values.idStaff}
              onChange={handleChange}
              disabled={Boolean(disabled)}
              invalid={Boolean(touched.idStaff && errors.idStaff)}
            >
              <option value="">Selecione</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name ||
                    `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() ||
                    instructor.id}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>

        <Col md="5">
          <FormGroup>
            <Label>Área</Label>
            <Input
              type="select"
              name="idArea"
              value={values.idArea}
              onChange={handleChange}
              disabled={Boolean(disabled)}
              invalid={Boolean(touched.idArea && errors.idArea)}
            >
              <option value="">Selecione</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name || area.id}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>

        <Col md="7">
          <FormGroup>
            <Label>Dias da semana</Label>
            <div
              className="d-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
                gap: "0.5rem",
                width: "100%",
              }}
            >
              {WEEKDAY_OPTIONS.map((option) => {
                const isActive = currentWeekdays.includes(option.value)
                return (
                  <Button
                    key={option.value}
                    type="button"
                    color={isActive ? "primary" : "light"}
                    className={`weekday-toggle__btn ${isActive ? "active" : ""}`}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.4rem",
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => handleWeekdayToggle(option.value)}
                    disabled={Boolean(disabled)}
                    title={WEEKDAY_LABELS[option.value]}
                  >
                    {WEEKDAY_SHORT_LABELS[option.value] || option.label}
                  </Button>
                )
              })}
            </div>
          </FormGroup>
        </Col>

        <Col md="12">
          <Row className="g-3">
            <Col md="4">
              <FormGroup>
                <Label>Hora início</Label>
                <Input
                  type="time"
                  name="startTime"
                  value={values.startTime}
                  onChange={handleStartTimeChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.startTime && errors.startTime)}
                />
              </FormGroup>
            </Col>

            <Col md="4">
              <FormGroup>
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  name="durationMinutes"
                  value={values.durationMinutes}
                  onChange={handleDurationChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.durationMinutes && errors.durationMinutes)}
                />
              </FormGroup>
            </Col>

            <Col md="4">
              <FormGroup>
                <Label>Capacidade máxima</Label>
                <Input
                  type="number"
                  name="maxCapacity"
                  value={values.maxCapacity}
                  onChange={handleChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.maxCapacity && errors.maxCapacity)}
                />
              </FormGroup>
            </Col>
          </Row>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label>Data início</Label>
            <Input
              type="date"
              name="startDate"
              value={values.startDate}
              onChange={handleChange}
              disabled={Boolean(disabled)}
              invalid={Boolean(touched.startDate && errors.startDate)}
            />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label>Data fim</Label>
            <Input
              type="date"
              name="endDate"
              value={values.endDate}
              onChange={handleChange}
              disabled={Boolean(disabled)}
              invalid={Boolean(touched.endDate && errors.endDate)}
              placeholder="Opcional"
            />
          </FormGroup>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-4">
        {onDelete && values.id ? (
          <ButtonLoader
            color="danger"
            outline
            onClick={onDelete}
            disabled={Boolean(disabled) || saving}
            loading={saving}
          >
            Excluir turma
          </ButtonLoader>
        ) : (
          <div />
        )}

        <div className="d-flex gap-2">
          {values.id && (
            <Button
              color="secondary"
              outline
              onClick={() => onSave({ ...values, cancelEdit: true })} // Simple way to cancel? Or parent handles reset
              disabled={disabled || saving}
            >
              Cancelar
            </Button>
          )}
          <ButtonLoader
            color="primary"
            onClick={onSave}
            disabled={Boolean(disabled) || !onSave}
            loading={saving}
          >
            {values.id ? "Atualizar turma" : "Criar turma"}
          </ButtonLoader>
        </div>
      </div>
    </div>
  )
}

ScheduleForm.propTypes = {
  values: PropTypes.object.isRequired,
  errors: PropTypes.object,
  touched: PropTypes.object,
  handleChange: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func,
  activities: PropTypes.array,
  instructors: PropTypes.array,
  areas: PropTypes.array,
  disabled: PropTypes.bool,
  onSave: PropTypes.func,
  onDelete: PropTypes.func, // New prop
  saving: PropTypes.bool,
}

export default ScheduleForm
