import React from "react"
import PropTypes from "prop-types"
import { Button, Input, Col, Row, Alert, Badge } from "reactstrap"

import { useActivityObjectivesTopics } from "../Hooks/useActivityObjectivesTopics"
import { useEvaluationDraft } from "../Hooks/useEvaluationDraft"
import { useTestFormLogic } from "../Hooks/useTestFormLogic"
import { useSaveEvaluations } from "../Hooks/useSaveEvaluations"
import LevelDropdown from "../../Grade/Components/LevelDropdown"
import ButtonLoader from "../../../components/Common/ButtonLoader"
// import CenterLoader from "../../../components/Common/CenterLoader" // Removed
import PageLoader from "../../../components/Common/PageLoader" // Replaced
import OverlayLoader from "../../../components/Common/OverlayLoader"
// import { useToast } from "../../../components/Common/ToastProvider" // Removed

import { PLACEHOLDER_AVATAR as placeholderAvatar } from "../Constants/evaluationDefaults"

const EvaluationForm = ({
  classId,
  idActivity,
  evaluationLogic,
  activeTab,
}) => {
  // const toast = useToast() // Not using provider anymore

  const {
    isLoading,
    anyLoading,
    withLoading,
    levels,
    activeEvent,
    activeTestEvent,
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
    dirtyCount: evaluationDirtyCount,
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

  const {
    testDrafts,
    handleResultChange,
    handleNotesChange,
    saveTests,
    dirtyCount: testsDirtyCount
  } = useTestFormLogic({
    idActivity,
    activeEvent: activeTestEvent,
    clients: allClients,
    excludedIds: excludedClientIds,
    withLoading
  })

  const { saveAll: saveEvaluations, sendEvaluationToClient } = useSaveEvaluations({
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
    return <PageLoader />
  }

  const isTechnicalTab = activeTab === "1"
  const isTestTab = activeTab === "2"

  return (
    <div className="class-clients position-relative">
      <OverlayLoader show={anyLoading} label="Processando..." />

      {isTechnicalTab && !activeEvent && (
        <Alert color="warning" className="mb-4 d-flex align-items-center" fade={false}>
          <i className="mdi mdi-alert-outline fs-4 me-3"></i>
          <div>
            <h5 className="alert-heading font-size-14 mb-1">Período de avaliação fechado</h5>
            <p className="mb-0 small">Consulte a gerência para iniciar um novo ciclo de avaliações técnicas.</p>
          </div>
        </Alert>
      )}

      {isTestTab && !activeTestEvent && (
        <Alert color="info" className="mb-4 d-flex align-items-center" fade={false}>
          <i className="mdi mdi-information-outline fs-4 me-3"></i>
          <div>
            <h5 className="alert-heading font-size-14 mb-1">Cilco de Testes indisponível</h5>
            <p className="mb-0 small">Não há provas ou testes de performance agendados para este período.</p>
          </div>
        </Alert>
      )}

      {/* HEADER TÉCNICO (Apenas na Tab 1) */}
      {isTechnicalTab && activeEvent && (
        <div className="mb-4 bg-light p-3 rounded border">
          <Row className="g-2 align-items-end">
            <Col xs="12" md="5">
              <label className="form-label fw-bold mb-1 small text-uppercase">Objetivo</label>
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
              <label className="form-label fw-bold mb-1 small text-uppercase">Tópico</label>
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
                <Button color="primary" outline size="sm" onClick={handlePrev} disabled={objectives.length === 0 || isFirstTopicOfFirstObjective}>
                  <i className="mdi mdi-chevron-left" />
                </Button>
                <Button color="primary" outline size="sm" onClick={handleNext} disabled={objectives.length === 0 || isLastTopicOfLastObjective}>
                  <i className="mdi mdi-chevron-right" />
                </Button>
              </div>
            </Col>
          </Row>
          {isLoading("prefill") && (
            <div className="mt-2 small text-muted">
              <i className="mdi mdi-loading mdi-spin me-1" /> Sincronizando dados anteriores...
            </div>
          )}
        </div>
      )}

      {/* HEADER TESTES (Apenas na Tab 2) */}
      {isTestTab && activeTestEvent && (
        <div className="mb-4 bg-light p-3 rounded border">
          <div className="d-flex align-items-center gap-3">
            <div className="flex-shrink-0 bg-white p-2 rounded border shadow-sm">
              <i className={`mdi ${(['fixed-time', 'distance'].includes(activeTestEvent.testConfig?.measureType)) ? 'mdi-timer-sand' : 'mdi-run-fast'} fs-3 text-primary`}></i>
            </div>
            <div>
              <h6 className="mb-1 fw-bold">{activeTestEvent.name}</h6>
              <div className="small text-muted">
                <strong>Prova: </strong>
                {(['fixed-time', 'distance'].includes(activeTestEvent.testConfig?.measureType))
                  ? `Tempo Fixo (${activeTestEvent.testConfig.referenceValue}${activeTestEvent.testConfig.unit}) - Medir Distância`
                  : `Distância Fixa (${activeTestEvent.testConfig.referenceValue}${activeTestEvent.testConfig.unit}) - Medir Tempo`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de alunos */}
      <div className="clients-list">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <h6 className="mb-0 fw-bold">Alunos para {isTechnicalTab ? 'Avaliação' : 'Teste'}</h6>
          <Badge color="dark" pill>{evaluationClients.length}</Badge>
        </div>

        {evaluationClients.length === 0 ? (
          <div className="text-center py-5 border rounded bg-light border-dashed">
            <i className="mdi mdi-account-search-outline fs-1 text-muted opacity-50 mb-3 d-block"></i>
            <p className="text-muted mb-0 font-size-13">Nenhum aluno apto encontrado.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {evaluationClients.map(client => {
              const sId = String(client.id)
              const currentLevel = currentTopicLevels?.[sId] || defaultLevelId || ""
              const testDraft = testDrafts[sId] || { result: '', notes: '' }

              return (
                <div key={sId} className="attendance-item">
                  <div className="attendance-item__avatar">
                    <img src={client.photo || placeholderAvatar} alt={client.name} />
                  </div>

                  <div className="attendance-item__content">
                    <div className="d-flex align-items-center gap-2">
                      <div className="fw-bold text-dark fs-5">{client.name}</div>
                      {(client.friendlyId || client.idGym) && <span className="text-muted small">#{client.friendlyId || client.idGym}</span>}
                    </div>
                    <div className="d-flex gap-2 align-items-center mt-1">
                      {client.tag && <span className="badge bg-light text-muted border px-2 py-1">{client.tag}</span>}

                      {/* Status do Cliente */}
                      {(client.lifecycleStatus || client.clientStatus) && (
                        <Badge color={
                          (client.lifecycleStatus || client.clientStatus) === 'active' ? 'success' :
                            (client.lifecycleStatus || client.clientStatus) === 'suspended' ? 'warning' : 'secondary'
                        } className="px-2 border">
                          {(client.lifecycleStatus || client.clientStatus) === 'active' ? 'Ativo' :
                            (client.lifecycleStatus || client.clientStatus) === 'suspended' ? 'Suspenso' :
                              (client.lifecycleStatus || client.clientStatus) === 'inactive' ? 'Inativo' : (client.lifecycleStatus || client.clientStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* CAMPOS CONDICIONAIS POR TAB */}
                  {isTechnicalTab ? (
                    <LevelDropdown
                      clientId={sId}
                      currentLevel={currentLevel}
                      onLevelChange={handleLevelChange}
                      levels={levels}
                      disabled={!selectedTopicId || isLoading("prefill") || !activeEvent}
                    />
                  ) : (
                    <div className="d-flex align-items-center gap-2" style={{ maxWidth: '180px' }}>
                      <Input
                        placeholder={(['fixed-time', 'distance'].includes(activeTestEvent?.testConfig?.measureType)) ? "Metros" : "00:00:00"}
                        className="bg-light border-0 fw-bold text-center"
                        value={testDraft.result}
                        onChange={(e) => handleResultChange(sId, e.target.value)}
                        disabled={!activeTestEvent}
                      />
                      <Badge color="secondary" className="text-uppercase border" style={{ fontSize: '0.65rem' }}>
                        {(['fixed-time', 'distance'].includes(activeTestEvent?.testConfig?.measureType)) ? 'Dist.' : 'Tempo'}
                      </Badge>
                    </div>
                  )}

                  <Button
                    color="link"
                    className="text-success p-0 ms-2"
                    type="button"
                    title="Enviar Resultado via WhatsApp"
                    onClick={() => sendEvaluationToClient(client)}
                  >
                    <i className="mdi mdi-whatsapp fs-5" />
                  </Button>

                  <Button
                    color="link"
                    className="text-muted p-0 ms-2"
                    type="button"
                    onClick={() => toggleExcludeClient(sId)}
                  >
                    <i className="mdi mdi-close-circle-outline fs-5" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* FEEDBACK DE ALUNOS REMOVIDOS (ARPENDIMENTO UX) */}
        {excludedClientIds.size > 0 && (
          <div className="mt-4">
            <div className="d-flex align-items-center justify-content-between mb-2 px-1">
              <h6 className="small fw-bold text-muted text-uppercase mb-0">
                <i className="mdi mdi-eye-off-outline me-1"></i>
                Alunos Ocultos ({excludedClientIds.size})
              </h6>
              <Button
                color="link"
                size="sm"
                className="p-0 text-decoration-none small"
                onClick={() => {
                  excludedClientIds.forEach(id => toggleExcludeClient(id))
                }}
              >
                Restaurar Todos
              </Button>
            </div>

            <div className="d-flex flex-column gap-2 bg-soft-light p-2 rounded border border-dashed">
              {allClients
                .filter(c => excludedClientIds.has(String(c.id)))
                .map(client => (
                  <div key={client.id} className="d-flex align-items-center justify-content-between p-2 bg-white rounded border-bottom shadow-sm" style={{ opacity: 0.8 }}>
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={client.photo || placeholderAvatar}
                        alt={client.name}
                        className="rounded-circle border"
                        style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                      />
                      <span className="small fw-medium text-muted">{client.name}</span>
                    </div>
                    <Button
                      color="primary"
                      outline
                      size="xs"
                      className="py-0 px-2"
                      style={{ fontSize: '0.65rem', height: '20px' }}
                      onClick={() => toggleExcludeClient(client.id)}
                    >
                      Restaurar
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer com botões de ação */}
        <div className="d-flex justify-content-end mt-4 pt-3 border-top">
          {isTechnicalTab ? (
            <ButtonLoader
              color="success"
              onClick={saveEvaluations}
              loading={isLoading("saveAll")}
              disabled={isLoading("saveAll") || objectives.length === 0 || evaluationDirtyCount === 0 || !activeEvent}
              className="px-4 shadow-sm"
            >
              <i className="mdi mdi-check-all me-2" /> Salvar
            </ButtonLoader>
          ) : (
            <ButtonLoader
              color="primary"
              onClick={saveTests}
              loading={isLoading("saveTests")}
              disabled={isLoading("saveTests") || testsDirtyCount === 0 || !activeTestEvent}
              className="px-4 shadow-sm"
            >
              <i className="mdi mdi-check-all me-2" /> Salvar
            </ButtonLoader>
          )}
        </div>
      </div>
    </div>
  )
}

EvaluationForm.propTypes = {
  classId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  idActivity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  activeTab: PropTypes.string,
  evaluationLogic: PropTypes.object
}

export default EvaluationForm
