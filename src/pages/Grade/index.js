import React, { useEffect, useState } from "react"
import { Card, CardBody } from "reactstrap"
import { connect } from "react-redux"

import GradeHeader from "./Components/GradeHeader"
import GradeGrid from "./Components/GradeGrid"
import AttendanceModal from "./Components/AttendanceModal"
import { setBreadcrumbItems } from "../../store/actions"
import { useGrade } from "../../contexts/GradeContext"

import { useTenant } from "../../hooks/useTenant"
import { SessionCounterFixer } from "../../services/Core/SessionCounterFixer"

/**
 * Página Principal da Grade de Aulas (Operacional).
 * Agora utiliza o GradeContext para compartilhar o estado da semana entre os diferentes módulos.
 */
const Grade = ({ setBreadcrumbItems }) => {
  const { idTenant, idBranch } = useTenant()

  // 1. Obtém estado centralizado do Contexto
  const {
    sessions,
    setSessions,
    loading: loadingData,
    referenceDate,
    setReferenceDate,
    view,
    setView,
    turn,
    setTurn,
    showOccupancy,
    setShowOccupancy,
    weekStart,
    updateAttendanceInSession,
    updateEnrollmentCount
  } = useGrade()

  // 2. Estados Locais de Seleção (Específicos da Página)
  const [selectedScheduleId, setSelectedScheduleId] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedScheduleKey, setSelectedScheduleKey] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)

  // Script temporário para correção de contadores
  useEffect(() => {
    window.SessionCounterFixer = SessionCounterFixer
    window.runCountFix = () => SessionCounterFixer.fixAllSessionCounters(idTenant, idBranch)
  }, [idTenant, idBranch])

  useEffect(() => {
    const breadcrumbItems = [{ title: "Grade de Aulas", link: "/grade" }]
    setBreadcrumbItems("Grade de Aulas", breadcrumbItems)
  }, [setBreadcrumbItems])

  // Handler de Seleção na Grade
  const handleSelectSchedule = (schedule, iso) => {
    const id = String(schedule?.id || "")
    if (!id) return
    const key = iso ? `${id}|${iso}` : id
    setSelectedScheduleId(id)
    setSelectedScheduleKey(key)
    setSelectedSchedule({ ...schedule, __iso: iso })
    setShowAttendanceModal(true)
  }

  // Atualização Otimista após chamada de presença
  const handleAttendanceSaved = (attendanceData) => {
    if (!attendanceData || !attendanceData.idSession) return
    updateAttendanceInSession(attendanceData.idSession, attendanceData)
  }

  // Atualização Otimista após matrícula/desmatrícula no modal
  const handleEnrollmentChange = (eventData) => {
    if (!eventData || (!eventData.idSession && !eventData.id)) return
    updateEnrollmentCount(eventData.idSession || eventData.id, eventData.action)
  }

  return (
    <React.Fragment>
      <Card className="mb-4">
        <CardBody className="pb-2">
          <GradeHeader
            turn={turn}
            onTurnChange={setTurn}
            view={view}
            onViewChange={setView}
            referenceDate={referenceDate}
            onReferenceDateChange={setReferenceDate}
            showOccupancy={showOccupancy}
            onShowOccupancyChange={setShowOccupancy}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {!loadingData && sessions.length === 0 && (
            <div className="alert alert-info mb-3">
              <i className="mdi mdi-information me-2"></i>
              <strong>Nenhuma sessão encontrada.</strong>
              <p className="mb-0 mt-2">
                As sessões são geradas automaticamente a partir das turmas cadastradas.
                Verifique se há turmas ativas em <strong>Admin → Turmas</strong>.
              </p>
            </div>
          )}
          <GradeGrid
            turn={turn}
            view={view}
            referenceDate={referenceDate}
            weekStart={weekStart}
            schedules={sessions}
            showOccupancy={showOccupancy}
            loading={loadingData}
            onSelectSchedule={handleSelectSchedule}
            selectedScheduleId={selectedScheduleId}
            selectedScheduleKey={selectedScheduleKey}
          />
        </CardBody>
      </Card>

      <AttendanceModal
        key={selectedSchedule?.id || "attendance"}
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        schedule={selectedSchedule}
        onAttendanceSaved={handleAttendanceSaved}
        onEnrollmentChange={handleEnrollmentChange}
      />
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(Grade)
