import React, { useMemo, useState, useEffect } from "react"
import { Col, Container, Row, Nav, NavItem, NavLink, Input } from "reactstrap"
import classnames from "classnames"

import ClassBar from "../Grade/Components/ClassBar"

import EvaluationCard from "./Components/evaluationCard"
import TestCard from "./Components/TestCard"
import { useEvaluationData } from "./Hooks/useEvaluationData"
import { mapSessionsToEvaluationSchedules } from "./Utils/mappers"
import { formatISODate } from "../Grade/Utils/dateUtils"
import { isWithinTurn, occursOnDate } from "../Grade/Utils/gridUtils"
import PageLoader from "../../components/Common/PageLoader"

import { getActiveTestEvent } from "../../services/Events/events.service"

import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../store/actions"

const Evaluation = ({ setBreadcrumbItems }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [activeTab, setActiveTab] = useState("avaliacao")
  const [activeTestEvent, setActiveTestEvent] = useState(null) // Renamed from selectedTestEvent to be clear it's global/active
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const { sessions, activities, areas, staff, isLoading } = useEvaluationData()

  useEffect(() => {
    const breadcrumbItems = [{ title: "Avaliação", link: "/evaluation" }]
    setBreadcrumbItems("Avaliação", breadcrumbItems)
  }, [setBreadcrumbItems])

  useEffect(() => {
    const loadTestEvent = async () => {
      const evt = await getActiveTestEvent()
      setActiveTestEvent(evt)
    }
    loadTestEvent()
  }, [])

  const schedules = useMemo(() => {
    return mapSessionsToEvaluationSchedules(sessions, activities, areas, staff)
  }, [sessions, activities, areas, staff])

  const todaySchedules = useMemo(() => {
    const todayISO = formatISODate(currentDate)
    const todayDayIndex = currentDate.getDay()

    const dailySchedules = schedules.filter(schedule => {
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
    // Get unique instructors from the current day's classes
    const todayISO = formatISODate(currentDate)
    const todayDayIndex = currentDate.getDay()

    const dailySchedules = schedules.filter(schedule => {
      if (!schedule) return false
      if (!isWithinTurn("all", schedule.startTime)) return false
      return occursOnDate(schedule, todayISO, todayDayIndex)
    })

    const staffIdsOfToday = new Set(dailySchedules.map(s => s.idStaff).filter(Boolean))
    return staff.filter(s => staffIdsOfToday.has(s.id))
  }, [schedules, currentDate, staff])

  const handlePrevDay = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }

  const handleNextDay = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }

  if (isLoading("page") && !sessions.length) {
    return <PageLoader />
  }

  return (
    <Container fluid>
      <Row className="g-4">
        <Col xs="12" md="3" lg="3">
          <Nav pills className="mb-3 nav-justified bg-light p-1 rounded">
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "avaliacao" })}
                onClick={() => setActiveTab("avaliacao")}
                style={{ cursor: "pointer" }}
              >
                Avaliação
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "testes" })}
                onClick={() => setActiveTab("testes")}
                style={{ cursor: "pointer" }}
              >
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
            schedules={todaySchedules} // Always show classes
            emptyLabel="Nenhuma aula encontrada para este dia."
            onScheduleSelect={setSelectedSchedule} // Always select a schedule (class)
            selectedSchedule={selectedSchedule}
          />
        </Col>
        <Col xs="12" md="9" lg="9">
          {activeTab === 'testes' ? (
            <TestCard
              schedule={selectedSchedule}
              testEvent={activeTestEvent}
            />
          ) : (
            <EvaluationCard schedule={selectedSchedule} />
          )}
        </Col>
      </Row>
    </Container>
  )
}


export default connect(null, { setBreadcrumbItems })(Evaluation)