import React, { useEffect, useMemo, useState } from "react"
import { Card, CardBody } from "reactstrap"
import { connect } from "react-redux"

import GradeHeader from "./Components/GradeHeader"
import GradeGrid from "./Components/GradeGrid"
import AttendanceModal from "./Components/AttendanceModal"
import { getStartOfWeek } from "../../utils/sharedUtils"
import { setBreadcrumbItems } from "../../store/actions"
import { useGradeData } from "./Hooks/useGradeData"
// Removed direct service imports as they are used in the hook
import PageLoader from "../../components/Common/PageLoader"


import { useTenant } from "../../hooks/useTenant"
import { SessionCounterFixer } from "../../services/Maintenance/SessionCounterFixer"

const Grade = ({ setBreadcrumbItems }) => {
  const { idTenant, idBranch } = useTenant()
  const [turn, setTurn] = useState("all")
  // ...

  // Script temporário para correção de contadores
  useEffect(() => {
    window.SessionCounterFixer = SessionCounterFixer
    window.runCountFix = () => SessionCounterFixer.fixAllSessionCounters(idTenant, idBranch)

    console.log(
      "%c[MANUTENÇÃO] Para corrigir os contadores de matrícula, execute: window.runCountFix()",
      "color: orange; font-weight: bold; font-size: 14px;"
    )
  }, [idTenant, idBranch])

  const [view, setView] = useState("week")
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [showOccupancy, setShowOccupancy] = useState(true)
  const [selectedScheduleId, setSelectedScheduleId] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedScheduleKey, setSelectedScheduleKey] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  /* Hook handles data loading */
  const { sessions, setSessions, activities, areas, staff, loading: loadingData } = useGradeData(referenceDate)

  useEffect(() => {
    const breadcrumbItems = [{ title: "Grade de Aulas", link: "/grade" }]
    setBreadcrumbItems("Grade de Aulas", breadcrumbItems)
  }, [setBreadcrumbItems])

  const weekStart = useMemo(() => getStartOfWeek(referenceDate), [referenceDate])

  const schedules = useMemo(() => {
    return sessions.map(session => {
      const activity = (activities || []).find(a => String(a.id) === String(session.idActivity)) || {}
      const area = (areas || []).find(a => String(a.id) === String(session.idArea)) || {}



      const instructor = (staff || []).find(i => String(i.id) === String(session.idStaff)) || {}

      return {
        ...session,
        // Dados enriquecidos para exibição (apenas via relacionamentos)
        activityName: activity.name || 'Atividade',
        activityColor: activity.color || activity.colorHex || '#4CAF50',

        areaName: area.name || '',
        areaColor: area.color || area.colorHex || '#2196F3',

        instructorName: instructor.name || '',
        employeeName: instructor.name || '',

        // Garantia de campos para a grade
        capacity: session.capacity || session.maxCapacity || 20,
        enrolledCount: session.enrolledCount || 0,
        isActive: session.isActive !== false,
      }
    })
  }, [sessions, activities, areas, staff])

  const handleSelectSchedule = (schedule, iso) => {
    const id = String(schedule?.id || "")
    if (!id) return
    const key = iso ? `${id}| ${iso} ` : id
    setSelectedScheduleId(id)
    setSelectedScheduleKey(key)
    setSelectedSchedule({ ...schedule, __iso: iso })
    setShowAttendanceModal(true)
  }

  const handleAttendanceSaved = (attendanceData) => {
    if (!attendanceData || !attendanceData.idSession) {
      return
    }
    // Atualizar a sessão específica no estado local sem recarregar a página
    setSessions(prevSessions =>
      (Array.isArray(prevSessions) ? prevSessions : []).map(session => {
        if (!session) return session
        if (session.idSession === attendanceData.idSession) {
          return {
            ...session,
            attendanceRecorded: true,
            attendanceSnapshot: attendanceData.clients,
            presentCount: attendanceData.presentCount,
            absentCount: attendanceData.absentCount
          }
        }
        return session
      })
    )
  }

  if (loadingData && !sessions.length) {
    return <PageLoader />
  }

  const handleEnrollmentChange = (eventData) => {
    if (!eventData || (!eventData.idSession && !eventData.id)) return

    // O ID que vem do modal pode ser idSession ou id puro
    const targetId = String(eventData.idSession || eventData.id)

    setSessions(prev =>
      prev.map(s => {
        const currentId = String(s.idSession || s.id)
        if (currentId === targetId) {
          // Optimistically update enrolledCount
          const currentCount = Number(s.enrolledCount || 0)
          const newCount = eventData.action === 'remove'
            ? Math.max(0, currentCount - 1)
            : currentCount + 1

          return {
            ...s,
            enrolledCount: newCount
          }
        }
        return s
      })
    )
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
                Verifique se há turmas ativas em <strong>Admin → Turmas</strong> ou aguarde a geração automática diária.
              </p>
            </div>
          )}
          <GradeGrid
            turn={turn}
            view={view}
            referenceDate={referenceDate}
            weekStart={weekStart}
            schedules={schedules}
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
