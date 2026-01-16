import React from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Card, CardBody, CardHeader, Button } from "reactstrap"
import GradeHeader from "../../Grade/Components/GradeHeader"
import GradeGrid from "../../Grade/Components/GradeGrid"
import { getStartOfWeekSunday } from "../../Grade/Utils/dateUtils"
import PageLoader from "components/Common/PageLoader"
import ButtonLoader from "components/Common/ButtonLoader"
import { useEnrollPageData } from "../Hooks/useEnrollPageData"
import { useEnrollGrid } from "../Hooks/useEnrollGrid"
import { useEnrollmentActions } from "../Hooks/useEnrollmentActions"

/**
 * Página de matrícula do cliente em turmas/sessões.
 * Rota sugerida: /clients/:clientId/enroll
 */
const ClientEnrollPage = () => {
  const { clientId: clientIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const clientId = clientIdParam || searchParams.get("idClient") || searchParams.get("clientId")
  const navigate = useNavigate()

  const [referenceDate, setReferenceDate] = React.useState(new Date())
  const [turn, setTurn] = React.useState("all")
  const [view, setView] = React.useState("week")

  // Data Fetching
  const {
    activities,
    areas,
    staff,
    sessions,
    setSessions,
    existingEnrollments,
    setExistingEnrollments,
    client, // Get client
    isLoading: isLoadingData,
    loadData
  } = useEnrollPageData(clientId)

  // Grid Logic
  const {
    schedulesForGrid,
    selectedSessionKeys,
    setSelectedSessionKeys,
    toggleSelection
  } = useEnrollGrid({
    sessions,
    activities,
    areas,
    staff,
    existingEnrollments
  })

  // Enrollment Actions
  const enrollmentType = searchParams.get("type") || "regular"

  const {
    handleEnroll,
    isLoading: isLoadingAction
  } = useEnrollmentActions({
    clientId,
    clientName: client?.name || "", // Pass clientName
    selectedSessionKeys,
    schedulesForGrid,
    setSelectedSessionKeys,
    setExistingEnrollments,
    enrollmentType,
    setSessions, // Pass setter for optimistic update
    reloadPageData: loadData,
    clientPhone: client?.phone || client?.mobile || client?.whatsapp || "" // Pass clientPhone
  })

  const isLoading = (key) => {
    if (key === 'page') return isLoadingData('page')
    if (key === 'enroll') return isLoadingAction('enroll')
    return false
  }

  if (isLoading('page')) {
    return <PageLoader />
  }

  return (
    <div className="container-fluid py-3">
      <Card className="shadow-sm">
        <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="mb-0">Selecionar turmas</h5>
            <p className="mb-0 text-muted small">Escolha uma ou mais sessões para matricular o aluno.</p>
          </div>
          <div className="d-flex gap-2">
            <Button color="secondary" onClick={() => navigate(-1)} disabled={isLoading('enroll')}>
              Cancelar
            </Button>
            <ButtonLoader color="primary" onClick={handleEnroll} disabled={!selectedSessionKeys.length} loading={isLoading('enroll')}>
              {enrollmentType === 'experimental' ? "Agendar" : "Matricular"}
            </ButtonLoader>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-3">
            <GradeHeader
              turn={turn}
              onTurnChange={setTurn}
              view={view}
              onViewChange={setView}
              referenceDate={referenceDate}
              onReferenceDateChange={setReferenceDate}
              showOccupancy
              onShowOccupancyChange={() => { }}
            />
          </div>
          <div className="position-relative">
            <GradeGrid
              turn={turn}
              view={view}
              referenceDate={referenceDate}
              weekStart={getStartOfWeekSunday(referenceDate)}
              schedules={schedulesForGrid}
              showOccupancy
              selectable
              loading={isLoading('enroll')}
              selectedScheduleIds={selectedSessionKeys.map(k => k.split("|")[0])}
              onToggleSelection={toggleSelection}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default ClientEnrollPage
