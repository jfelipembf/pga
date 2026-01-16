import React, { useEffect, useMemo, useState } from "react"
import { Card, CardBody } from "reactstrap"
import { connect } from "react-redux"

import GradeHeader from "./Components/GradeHeader"
import GradeGrid from "./Components/GradeGrid"
import AttendanceModal from "./Components/AttendanceModal"
import { getStartOfWeekSunday } from "./Utils/dateUtils"
import { setBreadcrumbItems } from "../../store/actions"
import { mapSessionsToSchedules } from "./Utils/mappers"
import { useGradeData } from "./Hooks/useGradeData"
// Removed direct service imports as they are used in the hook
import PageLoader from "../../components/Common/PageLoader"


const Grade = ({ setBreadcrumbItems }) => {
  const [turn, setTurn] = useState("all")
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

  const weekStart = useMemo(() => getStartOfWeekSunday(referenceDate), [referenceDate])

  const schedules = useMemo(() => {
    return mapSessionsToSchedules(sessions, activities, areas, staff)
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
