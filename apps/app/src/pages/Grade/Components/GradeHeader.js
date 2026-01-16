import React from "react"
import { Col, FormGroup, Input, Label, Row, Button } from "reactstrap"

import TurnSelector from "./TurnSelector"
import ViewSelector from "./ViewSelector"
import WeekNavigator from "./WeekNavigator"

const GradeHeader = ({
  turn,
  onTurnChange,
  view,
  onViewChange,
  referenceDate,
  onReferenceDateChange,
  showOccupancy,
  onShowOccupancyChange,
}) => {
  return (
    <Row className="g-3 align-items-center">
      <Col xs="12" lg="5" className="d-flex align-items-center">
        <TurnSelector value={turn} onChange={onTurnChange} />
      </Col>
      <Col xs="12" lg="7">
        <div className="d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
          <WeekNavigator
            referenceDate={referenceDate}
            view={view}
            onReferenceDateChange={onReferenceDateChange}
          />
          <Button color="primary" size="sm" onClick={() => onReferenceDateChange(new Date())}>
            <i className="mdi mdi-calendar-today me-1" />
            Hoje
          </Button>
          <ViewSelector value={view} onChange={onViewChange} />
          <FormGroup switch className="d-flex align-items-center mb-0">
            <Input
              type="switch"
              role="switch"
              checked={showOccupancy}
              onChange={e => onShowOccupancyChange(e.target.checked)}
            />
            <Label check className="ms-2 text-muted small mb-0">
              Exibir lotação
            </Label>
          </FormGroup>
        </div>
      </Col>
    </Row>
  )
}

export default GradeHeader
