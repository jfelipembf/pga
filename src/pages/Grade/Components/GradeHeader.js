import React from "react"
import { Col, FormGroup, Input, Label, Row, Button } from "reactstrap"

import TurnSelector from "./TurnSelector"
import ViewSelector from "./ViewSelector"
import WeekNavigator from "./WeekNavigator"
import { FormSwitch } from "../../../components/Common/FormSwitch"

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
          <FormSwitch
            id="showOccupancySwitch"
            checked={showOccupancy}
            onChange={onShowOccupancyChange}
            label="Exibir lotação"
            width={34}
            height={18}
            handleDiameter={12}
          />
        </div>
      </Col>
    </Row>
  )
}

export default GradeHeader
