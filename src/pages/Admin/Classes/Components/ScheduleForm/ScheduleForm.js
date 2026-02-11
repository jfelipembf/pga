import React from "react"
import PropTypes from "prop-types"
import { Button, FormGroup, Label, Input, Row, Col, Alert, FormFeedback } from "reactstrap"

import { WEEKDAY_OPTIONS, WEEKDAY_LABELS, WEEKDAY_SHORT_LABELS } from "../../../../../constants/weekdays"
import ButtonLoader from "../../../../../components/Common/ButtonLoader"
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

  // Helper to safely get value (converts null to empty string for controlled inputs)
  const safeValue = (key) => {
    const val = values[key];
    return val === null || val === undefined ? "" : val;
  };

  return (
    <div className="schedule-form py-2">

      <Row>
        <Col lg={7}>
          <h5 className="font-size-15 mb-3 fw-bold text-dark border-bottom pb-2">
            <i className="mdi mdi-card-text-outline me-2 text-primary"></i>
            Informações da Turma
          </h5>

          <Row className="g-3">
            <Col md="6">
              <FormGroup>
                <Label className="fw-semibold text-dark">Atividade</Label>
                <Input
                  type="select"
                  name="idActivity"
                  className="form-control-lg"
                  value={safeValue("idActivity")}
                  onChange={handleChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.idActivity && errors.idActivity)}
                >
                  <option value="">Selecione a atividade...</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name || activity.id}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{errors.idActivity}</FormFeedback>
              </FormGroup>
            </Col>

            <Col md="6">
              <FormGroup>
                <Label className="fw-semibold text-dark">Instrutor Responsável</Label>
                <Input
                  type="select"
                  name="idStaff"
                  className="form-control-lg"
                  value={safeValue("idStaff")}
                  onChange={handleChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.idStaff && errors.idStaff)}
                >
                  <option value="">Selecione o instrutor...</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name ||
                        `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() ||
                        instructor.id}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{errors.idStaff}</FormFeedback>
              </FormGroup>
            </Col>

            <Col md="12">
              <FormGroup>
                <Label className="fw-semibold text-dark">Área / Localização</Label>
                <Input
                  type="select"
                  name="idArea"
                  className="form-control-lg"
                  value={safeValue("idArea")}
                  onChange={handleChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.idArea && errors.idArea)}
                >
                  <option value="">Selecione o local...</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name || area.id}
                    </option>
                  ))}
                </Input>
                <FormFeedback>{errors.idArea}</FormFeedback>
              </FormGroup>
            </Col>

            <Col md="12">
              <FormGroup className="mb-0">
                <Label className="fw-semibold text-dark mb-3 d-flex align-items-center">
                  <i className="mdi mdi-calendar-week me-2 text-primary font-size-18"></i>
                  Dias da semana ativos
                </Label>
                <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded-3 border border-light shadow-sm" style={{ maxWidth: "100%" }}>
                  {WEEKDAY_OPTIONS.map((option) => {
                    const isActive = currentWeekdays.includes(option.value)
                    return (
                      <div key={option.value} className="text-center flex-grow-1">
                        <button
                          type="button"
                          onClick={() => handleWeekdayToggle(option.value)}
                          disabled={Boolean(disabled)}
                          title={WEEKDAY_LABELS[option.value]}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: isActive ? "#556ee6" : "transparent",
                            color: isActive ? "#fff" : "#74788d",
                            fontWeight: isActive ? "700" : "500",
                            fontSize: "0.75rem",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                            boxShadow: isActive ? "0 4px 8px rgba(85, 110, 230, 0.3)" : "none",
                            cursor: disabled ? "default" : "pointer"
                          }}
                          className="weekday-btn"
                        >
                          {WEEKDAY_SHORT_LABELS[option.value]?.substring(0, 1) || option.label?.substring(0, 1)}
                        </button>
                        <span style={{
                          fontSize: "10px",
                          marginTop: "4px",
                          display: "block",
                          color: isActive ? "#556ee6" : "#adb5bd",
                          fontWeight: isActive ? "600" : "400",
                          textTransform: "uppercase"
                        }}>
                          {WEEKDAY_SHORT_LABELS[option.value] || option.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {(errors.weekdays || errors.weekday) && (touched.weekdays || touched.weekday) && (
                  <div className="text-danger small mt-2 px-1">
                    <i className="mdi mdi-alert-circle-outline me-1"></i>
                    {errors.weekdays || errors.weekday}
                  </div>
                )}
                {values.id && (
                  <div className="mt-3 p-2 bg-soft-warning rounded border border-warning border-opacity-25">
                    <p className="text-warning small mb-0 d-flex align-items-center">
                      <i className="mdi mdi-alert-circle-outline me-2 font-size-16"></i>
                      <span>
                        <strong>Atenção:</strong> Em modo de edição, você altera apenas o template deste dia específico.
                      </span>
                    </p>
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>
        </Col>

        <Col lg={5} className="border-start ps-lg-4">
          <h5 className="font-size-15 mb-3 fw-bold text-dark border-bottom pb-2">
            <i className="mdi mdi-clock-outline me-2 text-primary"></i>
            Horários e Vigência
          </h5>

          <Row className="g-3">
            <Col md="6">
              <FormGroup>
                <Label className="fw-semibold text-dark">Hora Início</Label>
                <Input
                  type="time"
                  name="startTime"
                  className="form-control-lg"
                  value={safeValue("startTime")}
                  onChange={handleStartTimeChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.startTime && errors.startTime)}
                />
                <FormFeedback>{errors.startTime}</FormFeedback>
              </FormGroup>
            </Col>

            <Col md="6">
              <FormGroup>
                <Label className="fw-semibold text-dark">Duração (min)</Label>
                <Input
                  type="number"
                  name="durationMinutes"
                  className="form-control-lg"
                  placeholder="60"
                  value={safeValue("durationMinutes")}
                  onChange={handleDurationChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.durationMinutes && errors.durationMinutes)}
                />
                <FormFeedback>{errors.durationMinutes}</FormFeedback>
              </FormGroup>
            </Col>

            <Col md="12">
              <FormGroup>
                <Label className="fw-semibold text-dark">Capacidade Máxima</Label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-light text-muted">
                    <i className="mdi mdi-account-group-outline"></i>
                  </span>
                  <Input
                    type="number"
                    name="maxCapacity"
                    placeholder="20"
                    value={safeValue("maxCapacity")}
                    onChange={handleChange}
                    disabled={Boolean(disabled)}
                    invalid={Boolean(touched.maxCapacity && errors.maxCapacity)}
                  />
                  <FormFeedback>{errors.maxCapacity}</FormFeedback>
                </div>
              </FormGroup>
            </Col>

            <Col md="6">
              <FormGroup>
                <Label className="fw-semibold text-dark">Vigência Início</Label>
                <Input
                  type="date"
                  name="startDate"
                  className="form-control-lg"
                  value={safeValue("startDate")}
                  onChange={handleChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.startDate && errors.startDate)}
                />
                <FormFeedback>{errors.startDate}</FormFeedback>
              </FormGroup>
            </Col>


            <Col md="6">
              <FormGroup>
                <Label className="fw-semibold text-dark">
                  Vigência Fim <span className="text-muted small">(Opcional)</span>
                </Label>
                <Input
                  type="date"
                  name="endDate"
                  className="form-control-lg"
                  value={safeValue("endDate")}
                  onChange={handleChange}
                  disabled={Boolean(disabled)}
                  invalid={Boolean(touched.endDate && errors.endDate)}
                  placeholder="Opcional"
                />
              </FormGroup>
            </Col>
          </Row>

          <div className="p-3 border rounded bg-soft-light small text-dark mt-4 border-dashed">
            <h6 className="font-size-12 fw-bold mb-1"><i className="mdi mdi-calendar-check me-1"></i>Dica de Operação</h6>
            Se não informar a data de fim, o sistema gerará sessões de forma recorrente.
          </div>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-5 pt-3 border-top">
        {onDelete && values.id ? (
          <ButtonLoader
            color="danger"
            outline
            className="px-4"
            onClick={onDelete}
            disabled={Boolean(disabled) || saving}
            loading={saving}
          >
            Excluir Turma
          </ButtonLoader>
        ) : (
          <div />
        )}

        <div className="d-flex gap-2">
          {values.id && (
            <Button
              color="secondary"
              outline
              className="px-4"
              onClick={() => onSave({ ...values, cancelEdit: true })}
              disabled={disabled || saving}
            >
              Cancelar
            </Button>
          )}
          <ButtonLoader
            color="primary"
            className="px-4 shadow-sm"
            onClick={onSave}
            disabled={Boolean(disabled) || !onSave}
            loading={saving}
          >
            {values.id ? "Atualizar" : "Salvar"}
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
