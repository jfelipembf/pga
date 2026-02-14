// Assuming standard relative import if needed
// This file likely imports sub-components or hooks.
// Let's verify its imports first with view_file or assume we fix them later when needed.
// However, I need to update index.js first.
// I will rewrite index.js to use the new sidebar and updated paths.
import React, { useMemo, useState, useEffect } from "react"
import { Col, Row, Button } from "reactstrap"
import { useLocation } from "react-router-dom"
import moment from "moment"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../store/actions"

import { EvaluationSidebar } from "./components/EvaluationSidebar"
import EvaluationCard from "./components/EvaluationCard"
import { useEvaluationData } from "./hooks/useEvaluationData"
import { mapSessionsToEvaluationSchedules } from "./utils/mappers"
import { toISODate, normalizeDate } from "../../utils/date"

// Local Helpers need to be kept or moved.
// For simplicity, I'll keep them in index for now or extract to utils.
// Let's keep existing logic in index but use the new component.


// Local Helpers to avoid circular dependencies with Grade module
const isWithinTurn = (turn, startTime) => {
  if (!startTime) return false
  if (!turn || turn === 'all') return true
  const hour = parseInt(startTime.split(':')[0])
  if (turn === 'morning') return hour < 12
  if (turn === 'afternoon') return hour >= 12 && hour < 18
  if (turn === 'night') return hour >= 18
  return true
}

const occursOnDate = (schedule, isoDate, dayIndex) => {
  const sessionDate = schedule?.sessionDate || null
  if (sessionDate) {
    const d = normalizeDate(sessionDate)
    if (!d) return false
    return toISODate(d) === String(isoDate).slice(0, 10)
  }
  const weekDays = Array.isArray(schedule?.weekDays) ? schedule.weekDays : []
  if (weekDays.length > 0) {
    if (!weekDays.includes(dayIndex)) return false
    const startDate = schedule?.startDate ? toISODate(normalizeDate(schedule.startDate)) : null
    const endDate = schedule?.endDate ? toISODate(normalizeDate(schedule.endDate)) : null
    const targetIso = String(isoDate).slice(0, 10)
    if (startDate && targetIso < startDate) return false
    if (endDate && targetIso > endDate) return false
    return true
  }
  return false
}

const EvaluationPage = ({ setBreadcrumbItems }) => {
  const location = useLocation()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  // Set initial tab based on URL
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes("tests") ? "performance" : "technical"
  )

  const [selectedStaffId, setSelectedStaffId] = useState("")
  const { sessions, activities, areas, staff } = useEvaluationData(currentDate)

  // Sync tab with URL changes
  useEffect(() => {
    setActiveTab(location.pathname.includes("tests") ? "performance" : "technical")
  }, [location.pathname])

  useEffect(() => {
    const title = location.pathname.includes("tests") ? "Testes de Performance" : "Avaliação Técnica"
    const breadcrumbItems = [{ title, link: location.pathname }]
    setBreadcrumbItems(title, breadcrumbItems)
  }, [setBreadcrumbItems, location.pathname])

  const schedules = useMemo(() => {
    return mapSessionsToEvaluationSchedules(sessions, activities, areas, staff)
  }, [sessions, activities, areas, staff])

  const todaySchedules = useMemo(() => {
    const todayISO = toISODate(currentDate)
    const todayDayIndex = currentDate.getDay()

    const dailySchedules = (schedules || []).filter(schedule => {
      if (!schedule) return false
      if (!isWithinTurn("all", schedule.startTime)) return false
      return occursOnDate(schedule, todayISO, todayDayIndex)
    })

    return dailySchedules
      .filter(schedule => {
        return !selectedStaffId || String(schedule.idStaff) === String(selectedStaffId)
      })
      .sort((a, b) => {
        const timeA = a.startTime || "00:00"
        const timeB = b.startTime || "00:00"
        return timeA.localeCompare(timeB)
      })
  }, [schedules, currentDate, selectedStaffId])

  const instructors = useMemo(() => {
    // Retornamos todos os professores para facilitar a busca, ordenados por nome
    return [...staff].sort((a, b) => {
      const nameA = a.name || `${a.firstName || ""} ${a.lastName || ""}`.trim()
      const nameB = b.name || `${b.firstName || ""} ${b.lastName || ""}`.trim()
      return nameA.localeCompare(nameB)
    })
  }, [staff])

  const handlePrevDay = () => {
    setCurrentDate(prev => moment(prev).subtract(1, 'days').toDate())
  }

  const handleNextDay = () => {
    setCurrentDate(prev => moment(prev).add(1, 'days').toDate())
  }

  // Incremental loading: structure appears first

  return (
    <div className="container-fluid p-0 p-md-2">
      <Row className="g-2 g-md-4">
        <Col xs="12" md="3" lg="3" className={selectedSchedule ? "d-none d-md-block" : ""}>
          <EvaluationSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedStaffId={selectedStaffId}
            setSelectedStaffId={setSelectedStaffId}
            instructors={instructors}
            currentDate={currentDate}
            handlePrevDay={handlePrevDay}
            handleNextDay={handleNextDay}
            todaySchedules={todaySchedules}
            selectedSchedule={selectedSchedule}
            setSelectedSchedule={setSelectedSchedule}
          />
        </Col>

        <Col xs="12" md="9" lg="9" className={!selectedSchedule ? "d-none d-md-block" : ""}>
          {/* Botão Voltar (Visível apenas Mobile) */}
          <div className="d-md-none mb-3">
            <Button color="light" className="w-100 shadow-sm border-0 fw-medium" onClick={() => setSelectedSchedule(null)}>
              <i className="mdi mdi-arrow-left me-2"></i> Voltar para Lista de Turmas
            </Button>
          </div>

          <EvaluationCard
            schedule={selectedSchedule}
            activeMode={activeTab} // 'technical' or 'performance'
          />
        </Col>
      </Row>
    </div>
  )
}

export default connect(null, { setBreadcrumbItems })(EvaluationPage)