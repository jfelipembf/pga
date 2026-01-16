import React from "react"
import PropTypes from "prop-types"
import { Button, Input, Col, Row, Alert } from "reactstrap"

import { useActivityObjectivesTopics } from "../../../hooks/evaluation/useActivityObjectivesTopics"
import { useEvaluationDraft } from "../../../hooks/evaluation/useEvaluationDraft"
import { useSaveEvaluations } from "../../../hooks/evaluation/useSaveEvaluations"
import LevelDropdown from "../../Grade/Components/LevelDropdown"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import CenterLoader from "../../../components/Common/CenterLoader"
import { useToast } from "../../../components/Common/ToastProvider"

import { PLACEHOLDER_AVATAR as placeholderAvatar } from "../Constants/evaluationDefaults"

const EvaluationForm = ({
  classId,
  idActivity,
  evaluationLogic,
}) => {
  const toast = useToast()

  const {
    isLoading,
    withLoading,
    levels,
    activeEvent,
    allClients,
    evaluationClients,
    defaultLevelId,
    toggleExcludeClient,
    excludedClientIds
  } = evaluationLogic

  const {
    objectives,
    topics,
    selectedObjective,
    selectedObjectiveId,
    selectedTopicId,
    handleSelectObjective,
    handleSelectTopic,
    handleNext,
    handlePrev,
    isLastTopicOfLastObjective,
    isFirstTopicOfFirstObjective,
    allTopicIds,
    topicMetaById,
  } = useActivityObjectivesTopics({ idActivity, withLoading })

  const {
    draftLevelsByTopicId,
    currentTopicLevels,
    dirtyCount,
    handleLevelChange,
  } = useEvaluationDraft({
    idActivity,
    selectedTopicId,
    clients: allClients,
    excludedIds: excludedClientIds,
    defaultLevelId,
    withLoading,
    activeEventId: activeEvent?.id,
  })

  const { saveAll } = useSaveEvaluations({
    idActivity,
    classId,
    clients: allClients,
    excludedIds: excludedClientIds,
    draftLevelsByTopicId,
    allTopicIds,
    topicMetaById,
    defaultLevelId,
    levels,
    withLoading,
    toast,
    activeEventId: activeEvent?.id,
  })

  if (!classId) {
    return (
      <div className="text-center py-5">
        <div
          className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3"
          style={{ width: 64, height: 64 }}
        >
          <i className="mdi mdi-account-group text-muted fs-4" />
        </div>
        <p className="text-muted mb-0">Selecione uma turma para ver os alunos matriculados.</p>
      </div>
    )
  }

  const showInitialLoader =
    isLoading("checkEvent") || isLoading("clients") || isLoading("levels") || (isLoading("objectives") && !objectives.length)

  if (showInitialLoader) {
    return <CenterLoader label="Carregando..." />
  }

  const isEvaluationDisabled = !activeEvent

  return (
    <div className="class-clients">

      {isEvaluationDisabled && (
        <Alert color="warning" className="mb-4" fade={false}>
          <h5 className="alert-heading font-size-14"><i className="mdi mdi-alert-outline me-2"></i> Período de avaliação fechado</h5>
          <p className="mb-0">
            Não há período de avaliação configurado para a data de hoje. Consulte a gerência para iniciar um novo ciclo de avaliações.
          </p>
        </Alert>
      )}

      {/* Objetivo / Tópico + navegação */}
      <div className="mb-4">
        <Row className="g-2 align-items-end">
          <Col xs="12" md="5">
            <label className="form-label fw-semibold mb-1">Objetivo</label>
            <Input
              type="select"
              value={selectedObjectiveId}
              onChange={e => handleSelectObjective(e.target.value)}
              disabled={!idActivity || isLoading("objectives") || objectives.length === 0}
            >
              {objectives.length === 0 ? (
                <option value="">{!idActivity ? "Selecione uma turma/atividade" : "Nenhum objetivo"}</option>
              ) : (
                objectives.map(o => (
                  <option key={o.id} value={String(o.id)}>
                    {(o.order != null ? `${o.order}. ` : "") + (o.title || "Objetivo")}
                  </option>
                ))
              )}
            </Input>
          </Col>

          <Col xs="12" md="5">
            <label className="form-label fw-semibold mb-1">Tópico</label>
            <Input
              type="select"
              value={selectedTopicId}
              onChange={e => handleSelectTopic(e.target.value)}
              disabled={!selectedObjective || isLoading("objectives") || topics.length === 0}
            >
              {topics.length === 0 ? (
                <option value="">Nenhum tópico</option>
              ) : (
                topics.map(t => (
                  <option key={t.id} value={String(t.id)}>
                    {(t.order != null ? `${t.order}. ` : "") + (t.description || "Tópico")}
                  </option>
                ))
              )}
            </Input>
          </Col>

          <Col xs="12" md="2">
            <div className="d-flex align-items-center gap-2 justify-content-md-end">
              <Button
                color="primary"
                type="button"
                onClick={handlePrev}
                disabled={objectives.length === 0 || isFirstTopicOfFirstObjective}
                title="Voltar"
              >
                <i className="mdi mdi-chevron-left" />
              </Button>
              <Button
                color="primary"
                type="button"
                onClick={handleNext}
                disabled={objectives.length === 0 || isLastTopicOfLastObjective}
                title="Avançar"
              >
                <i className="mdi mdi-chevron-right" />
              </Button>
            </div>
          </Col>
        </Row>

        {/* Mini status sem flicker: mostra que está pré-carregando o tópico */}
        <div className="d-flex align-items-center gap-2 mt-2">
          {isLoading("prefill") ? (
            <span className="text-muted small">
              <i className="mdi mdi-loading mdi-spin me-1" /> Carregando níveis anteriores…
            </span>
          ) : null}
        </div>
      </div>



      {/* Lista de alunos */}
      <div className="clients-list">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0 fw-bold">Alunos Matriculados</h6>
          <span className="badge bg-dark">{evaluationClients.length}</span>
        </div>

        {evaluationClients.length === 0 ? (
          <div className="text-center py-5">
            <div
              className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 64, height: 64 }}
            >
              <i className="mdi mdi-account-search text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">
              Nenhum aluno matriculado nesta turma.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {evaluationClients.map(client => {
              const sId = String(client.id)
              const currentLevel = currentTopicLevels?.[sId] || defaultLevelId || ""

              return (
                <div
                  key={sId}
                  className="d-flex align-items-center gap-3 px-3 py-3 border rounded bg-white shadow-sm"
                  style={{ transition: "background-color 200ms ease" }}
                >
                  <div
                    className="rounded-circle bg-light flex-shrink-0"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundImage: `url(${client.photo || placeholderAvatar})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{client.name}</div>
                    <div className="text-muted small">ID: {client.idGym}</div>
                  </div>

                  <LevelDropdown
                    clientId={sId}
                    currentLevel={currentLevel}
                    onLevelChange={handleLevelChange}
                    levels={levels}
                    disabled={!selectedTopicId || isLoading("prefill")}
                  />

                  <Button
                    color="link"
                    className="text-danger p-0 ms-2"
                    type="button"
                    title="Remover da avaliação"
                    onClick={() => toggleExcludeClient(sId)}
                  >
                    <i className="mdi mdi-close-circle-outline fs-5" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <div className="d-flex justify-content-end mt-4">
          <ButtonLoader
            color="success"
            onClick={saveAll}
            loading={isLoading("saveAll")}
            disabled={isLoading("saveAll") || objectives.length === 0 || dirtyCount === 0 || isEvaluationDisabled}
            className="d-flex align-items-center gap-2"
            type="button"
          >
            <i className="mdi mdi-content-save-outline" />
            Salvar
          </ButtonLoader>
        </div>
      </div>
    </div>
  )
}

EvaluationForm.propTypes = {
  classId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  idActivity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default EvaluationForm
