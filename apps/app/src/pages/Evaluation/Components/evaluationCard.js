import React from "react"
import PropTypes from "prop-types"
import { Card, CardBody, CardHeader, Badge } from "reactstrap"
import EvaluationForm from "./evaluationForm"
import { useEvaluationFormLogic } from "../Hooks/useEvaluationFormLogic"
import ClientAddSearch from "../../../components/Common/ClientAddSearch"

const EvaluationCard = ({ schedule }) => {
  const {
    isLoading,
    searchText,
    setSearchText,
    levels,
    activeEvent,
    allClients,
    evaluationClients,
    addCandidates,
    showNoAutocompleteResults,
    defaultLevelId,
    toggleExcludeClient,
    handleAddClient,
    excludedClientIds,
  } = useEvaluationFormLogic({ classId: schedule?.idClass })

  if (!schedule) {
    return (
      <Card className="h-100 shadow-sm">
        <CardHeader className="bg-white border-bottom py-3">
          <div className="text-center text-muted">
            <i className="mdi mdi-calendar-blank me-2" />
            Nenhum evento selecionado
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          <div className="text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <i className="mdi mdi-cursor-default-click text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">Clique em um evento para ver os detalhes.</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  const {
    activityName,
    employeeName,
    startTime,
    endTime,
    color
  } = schedule

  const isEvaluationDisabled = !activeEvent

  return (
    <Card className="h-100 shadow-sm">
      <CardHeader
        className="bg-white border-bottom py-3"
        style={color ? { borderTop: `3px solid ${color}` } : undefined}
      >
        <div className="d-flex flex-column gap-3">
          {/* Info Area: Activity (Top) and Instructor (Below) */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div className="flex-grow-1">
              <h4 className="mb-1 fw-bold">{activityName || "Evento"}</h4>
              {employeeName && (
                <div className="text-muted small d-flex align-items-center gap-1">
                  <i className="mdi mdi-account" />
                  <span>{employeeName}</span>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 mt-1">
              <Badge color="secondary" className="text-white px-2 py-1" style={{ fontSize: '0.75rem' }}>
                <i className="mdi mdi-clock me-1" />
                {startTime} — {endTime}
              </Badge>
            </div>
          </div>

          {/* Search Area integrated into header */}
          <div className="w-100">
            <ClientAddSearch
              value={searchText}
              onChange={setSearchText}
              disabled={isLoading("clients") || isEvaluationDisabled}
              candidates={addCandidates}
              onSelect={handleAddClient}
              showNoResults={showNoAutocompleteResults}
              noResultsLabel="Nenhum cliente encontrado com contrato ativo para adicionar."
            />
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-3">
        {schedule?.idClass ? (
          <EvaluationForm
            classId={schedule.idClass}
            idActivity={schedule.idActivity}
            evaluationLogic={{
              isLoading,
              levels,
              activeEvent,
              allClients,
              evaluationClients,
              toggleExcludeClient,
              defaultLevelId,
              excludedClientIds
            }}
          />
        ) : (
          <div className="text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <i className="mdi mdi-calendar-check text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">Evento selecionado</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

EvaluationCard.propTypes = {
  schedule: PropTypes.shape({
    activityName: PropTypes.string,
    employeeName: PropTypes.string,
    areaName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    maxCapacity: PropTypes.number,
    enrolledCount: PropTypes.number,
    attendanceRecorded: PropTypes.bool,
    presentCount: PropTypes.number,
    absentCount: PropTypes.number,
    color: PropTypes.string,
  })
}

export default EvaluationCard
