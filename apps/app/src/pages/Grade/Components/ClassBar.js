import PropTypes from "prop-types"
import React from "react"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
} from "reactstrap"
import GradeEventCard from "./GradeEventCard"

const formatHeaderDate = value => {
  const d = value instanceof Date ? value : value ? new Date(value) : new Date()
  if (Number.isNaN(d.getTime())) return "--"
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  return `${dd}-${mm}-${yyyy}`
}

const ClassBar = ({
  items,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  emptyLabel,
  date,
  onPrevDay,
  onNextDay,
  schedules,
  onScheduleSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
  className,
}) => {

  return (
    <Card className={`h-100 shadow-sm bg-white ${className || ""}`.trim()}>
      <CardHeader className="bg-white border-bottom py-3">
        <div className="d-flex align-items-center justify-content-between px-1">
          <Button
            color="light"
            className="border rounded d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 40, height: 40 }}
            onClick={onPrevDay}
            type="button"
            disabled={!onPrevDay}
          >
            <i className="mdi mdi-chevron-left fs-5" />
          </Button>

          <div className="text-center flex-grow-1">
            <div className="fw-bold text-primary mb-0">{formatHeaderDate(date)}</div>
          </div>

          <Button
            color="light"
            className="border rounded d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 40, height: 40 }}
            onClick={onNextDay}
            type="button"
            disabled={!onNextDay}
          >
            <i className="mdi mdi-chevron-right fs-5" />
          </Button>
        </div>
      </CardHeader>
      <CardBody className="pt-3 bg-white">
        {schedules && schedules.length > 0 ? (
          <div className="d-flex flex-wrap gap-3">
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className="flex-grow-1"
                style={{
                  width: "100%",
                  minWidth: 240,
                  maxWidth: 420,
                }}
              >
                <GradeEventCard
                  schedule={schedule}
                  showOccupancyMask={true}
                  onClick={() => onScheduleSelect?.(schedule)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <i className="mdi mdi-calendar-blank text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">{emptyLabel || "Nenhuma aula encontrada para este dia."}</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

ClassBar.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      meta: PropTypes.string,
      helper: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      draggable: PropTypes.bool,
    })
  ),
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  emptyLabel: PropTypes.string,
  date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  onPrevDay: PropTypes.func,
  onNextDay: PropTypes.func,
  schedules: PropTypes.array,
  onScheduleSelect: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragEnd: PropTypes.func,
  className: PropTypes.string,
}

export default ClassBar
