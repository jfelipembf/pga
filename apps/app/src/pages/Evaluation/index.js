import React, { useMemo, useState, useEffect } from "react"
import { Col, Container, Row, Nav, NavItem, NavLink } from "reactstrap"
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

    return schedules.filter(schedule => {
      if (!schedule) return false
      if (!isWithinTurn("all", schedule.startTime)) return false
      return occursOnDate(schedule, todayISO, todayDayIndex)
    })
  }, [schedules, currentDate])

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
      <Row className="mb-4">
        <Col>
          <Nav tabs>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "avaliacao" })}
                onClick={() => setActiveTab("avaliacao")}
                style={{ cursor: "pointer" }}
              >
                <i className="mdi mdi-clipboard-check-outline me-2" />
                Avaliação Técnica
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "testes" })}
                onClick={() => setActiveTab("testes")}
                style={{ cursor: "pointer" }}
              >
                <i className="mdi mdi-timer-outline me-2" />
                Testes de Performance
              </NavLink>
            </NavItem>
          </Nav>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xs="12" md="3" lg="3">
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