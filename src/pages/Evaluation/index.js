import React, { useMemo, useState, useEffect } from "react"
import { Col, Row, Nav, NavItem, NavLink, Input, Button } from "reactstrap"
import classnames from "classnames"
import moment from "moment"

import ClassBar from "../Grade/Components/ClassBar"

import EvaluationCard from "./Components/evaluationCard"
// import TestCard from "./Components/TestCard" // TODO: Migrate TestCard
import { useEvaluationData } from "./Hooks/useEvaluationData"
import { mapSessionsToEvaluationSchedules } from "./Utils/mappers"
import { toISODate, normalizeDate } from "../../utils/date"
import PageLoader from "../../components/Common/PageLoader"

// import { getActiveTestEvent } from "../../services/Events/events.service" // TODO: Create Events Service

import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../store/actions"

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
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [activeTab, setActiveTab] = useState("technical")
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const { sessions, activities, areas, staff, isLoading } = useEvaluationData(currentDate)

  useEffect(() => {
    const breadcrumbItems = [{ title: "Avaliação", link: "/evaluation" }]
    setBreadcrumbItems("Avaliação", breadcrumbItems)
  }, [setBreadcrumbItems])

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

  if (isLoading("page") && !sessions.length) {
    return <PageLoader />
  }

  return (
    <div className="container-fluid p-0 p-md-2">
      <Row className="g-2 g-md-4">
        <Col xs="12" md="3" lg="3" className={selectedSchedule ? "d-none d-md-block" : ""}>
          <Nav pills className="mb-3 nav-justified bg-light p-1 rounded shadow-sm">
            <NavItem>
              <NavLink
                active={activeTab === "technical"}
                onClick={() => setActiveTab("technical")}
                style={{ cursor: "pointer" }}
                className={classnames({ "bg-white text-primary shadow-sm": activeTab === "technical" })}
              >
                <i className="mdi mdi-medal-outline me-1"></i>
                Avaliação
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                active={activeTab === "performance"}
                onClick={() => setActiveTab("performance")}
                style={{ cursor: "pointer" }}
                className={classnames({ "bg-white text-primary shadow-sm": activeTab === "performance" })}
              >
                <i className="mdi mdi-timer-outline me-1"></i>
                Testes
              </NavLink>
            </NavItem>
          </Nav>

          <div className="mb-3">
            <Input
              type="select"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="form-select border-0 shadow-sm"
              style={{ backgroundColor: "#f8f9fa", fontWeight: "500" }}
            >
              <option value="">Todos os Professores</option>
              {instructors.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name || `${inst.firstName || ""} ${inst.lastName || ""}`.trim()}
                </option>
              ))}
            </Input>
          </div>
          <ClassBar
            date={currentDate}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            schedules={todaySchedules}
            emptyLabel="Nenhuma aula encontrada para este dia."
            onScheduleSelect={setSelectedSchedule}
            selectedId={selectedSchedule?.id}
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