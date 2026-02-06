import React from "react"
import PropTypes from "prop-types"
import { Card, CardBody, CardHeader, Badge } from "reactstrap"
import EvaluationForm from "./evaluationForm"
import { useEvaluationFormLogic } from "../Hooks/useEvaluationFormLogic"
import ClientAddSearch from "../../../components/Common/ClientAddSearch"

const EvaluationCard = ({ schedule, activeMode = "technical" }) => {
  const {
    isLoading,
    anyLoading,
    withLoading,
    searchText,
    setSearchText,
    levels,
    activeEvent,
    activeTestEvent,
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
            Nenhuma turma selecionada
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          <div className="text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <i className="mdi mdi-account-group-outline text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">Selecione uma turma na lista lateral para iniciar.</p>
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

  const isEvaluationDisabled = activeMode === "technical" ? !activeEvent : !activeTestEvent
  const internalActiveTab = activeMode === "technical" ? "1" : "2"

  return (
    <Card className="h-100 shadow-sm border-0">
      <CardHeader
        className="bg-white border-bottom py-3"
        style={color ? { borderTop: `4px solid ${color}` } : undefined}
      >
        <div className="d-flex flex-column gap-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <Badge color={activeMode === 'technical' ? 'primary' : 'info'} pill className="px-2">
                  {activeMode === 'technical' ? 'Avaliação Técnica' : 'Testes de Performance'}
                </Badge>
              </div>
              <h4 className="mb-1 fw-bold text-dark">{activityName || "Evento"}</h4>
              {employeeName && (
                <div className="text-muted small d-flex align-items-center gap-1">
                  <i className="mdi mdi-account-circle-outline" />
                  <span>{employeeName}</span>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 mt-1">
              <Badge color="light" className="text-dark border px-2 py-1" style={{ fontSize: '0.85rem' }}>
                <i className="mdi mdi-clock-outline me-1 text-primary" />
                {startTime} — {endTime}
              </Badge>
            </div>
          </div>

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
      <CardBody className="p-2 p-md-3">
        {schedule?.idClass ? (
          <EvaluationForm
            classId={schedule.idClass}
            idActivity={schedule.idActivity}
            activeTab={internalActiveTab}
            evaluationLogic={{
              isLoading,
              anyLoading,
              withLoading,
              levels,
              activeEvent,
              activeTestEvent,
              allClients,
              evaluationClients,
              toggleExcludeClient,
              defaultLevelId,
              excludedClientIds
            }}
          />
        ) : null}
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
