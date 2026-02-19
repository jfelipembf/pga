import React, { useMemo, useState, useEffect } from "react"
import { Col, Row, Button } from "reactstrap"
import { useLocation } from "react-router-dom"
import moment from "moment"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../store/actions"

import { EvaluationSidebar } from "./components/EvaluationSidebar"
import EvaluationCard from "./components/EvaluationCard"
import { useEvaluationData } from "./hooks/useEvaluationData"
// Mappers removed - using GradeContext enrichment
import { toISODate, normalizeDate } from "../../utils/date"
import { useGrade } from "../../contexts/GradeContext"

// Local Helpers
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
  return false
}

/**
 * Página de Avaliação de Metodologia.
 * Consome o GradeContext para manter a data de referência sincronizada com a Grade e Planejamento.
 */
const EvaluationPage = ({ setBreadcrumbItems }) => {
  const location = useLocation()

  // 1. Estados e Dados Compartilhados via GradeContext
  const {
    referenceDate,
    setReferenceDate,
    sessions,
    updateAttendanceInSession // Poderíamos usar para atualizar o card após avaliação
  } = useGrade()

  const { activities, areas, staff } = useEvaluationData()

  // 2. Estados Locais da Página de Avaliação
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes("tests") ? "performance" : "technical"
  )

  // Sync tab with URL changes
  useEffect(() => {
    setActiveTab(location.pathname.includes("tests") ? "performance" : "technical")
  }, [location.pathname])

  useEffect(() => {
    const title = location.pathname.includes("tests") ? "Testes de Performance" : "Avaliação Técnica"
    const breadcrumbItems = [{ title, link: location.pathname }]
    setBreadcrumbItems(title, breadcrumbItems)
  }, [setBreadcrumbItems, location.pathname])

  // As sessões já vêm enriqueceadas do GradeContext (com activityName, employeeName, etc.)
  const schedules = sessions || []

  // Filtro de sessões para o dia selecionado (referenceDate)
  const todaySchedules = useMemo(() => {
    const todayISO = toISODate(referenceDate)
    const todayDayIndex = referenceDate.getDay()

    return (schedules || [])
      .filter(schedule => {
        if (!schedule) return false
        return occursOnDate(schedule, todayISO, todayDayIndex)
      })
      .filter(schedule => {
        return !selectedStaffId || String(schedule.idStaff) === String(selectedStaffId)
      })
      .sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"))
  }, [schedules, referenceDate, selectedStaffId])

  const instructors = useMemo(() => {
    return [...staff].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [staff])

  const handlePrevDay = () => {
    setReferenceDate(prev => moment(prev).subtract(1, 'days').toDate())
  }

  const handleNextDay = () => {
    setReferenceDate(prev => moment(prev).add(1, 'days').toDate())
  }

  return (
    <div className="container-fluid p-0 p-md-2">
      <Row className="g-2 g-md-4">
        {/* Lista Lateral de Turmas */}
        <Col xs="12" md="3" lg="3" className={selectedSchedule ? "d-none d-md-block" : ""}>
          <EvaluationSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedStaffId={selectedStaffId}
            setSelectedStaffId={setSelectedStaffId}
            instructors={instructors}
            currentDate={referenceDate}
            handlePrevDay={handlePrevDay}
            handleNextDay={handleNextDay}
            todaySchedules={todaySchedules}
            selectedSchedule={selectedSchedule}
            setSelectedSchedule={setSelectedSchedule}
          />
        </Col>

        {/* Card de Avaliação do Aluno */}
        <Col xs="12" md="9" lg="9" className={!selectedSchedule ? "d-none d-md-block" : ""}>
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