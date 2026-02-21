import React from "react"
import PropTypes from "prop-types"
import { Button, Input, Col, Row, Alert, Badge } from "reactstrap"

import { useActivityObjectivesTopics } from "../hooks/useActivityObjectivesTopics"
import { useEvaluationDraft } from "../hooks/useEvaluationDraft"
import { useTestFormLogic } from "../hooks/useTestFormLogic"
import { useSaveEvaluations } from "../hooks/useSaveEvaluations"
import LevelDropdown from "../../Grade/Components/LevelDropdown"
import ButtonLoader from "../../../components/Common/ButtonLoader"
// import CenterLoader from "../../../components/Common/CenterLoader" // Removed
// PageLoader removed
import OverlayLoader from "../../../components/Common/OverlayLoader"
// import { useToast } from "../../../components/Common/ToastProvider" // Removed

import { PLACEHOLDER_AVATAR as placeholderAvatar } from "../constants/evaluationDefaults"

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
    saveTests,
    dirtyCount: testsDirtyCount
  } = useTestFormLogic({
    idActivity,
    activeEvent: activeTestEvent,
    clients: allClients,
    excludedIds: excludedClientIds,
    withLoading
  })

  const { saveAll: saveEvaluations, sendEvaluationToClient, sendAllEvaluations, sendingStatus } = useSaveEvaluations({
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

  // Incremental loading: structure below will handle loading states

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
        <div className="mb-4 bg-light p-2 p-md-3 rounded border">
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
        <div className="mb-4 bg-light p-2 p-md-3 rounded border">
          <div className="d-flex align-items-center gap-3">
            <div className="flex-shrink-0 bg-white p-2 rounded border shadow-sm">
              <i className={`mdi ${(['fixed-time', 'distance'].includes(activeTestEvent?.testConfig?.measureType)) ? 'mdi-timer-sand' : 'mdi-run-fast'} fs-3 text-primary`}></i>
            </div>
            <div>
              <h6 className="mb-1 fw-bold">{activeTestEvent.name}</h6>
              <div className="small text-muted">
                <strong>Prova: </strong>
                {(['fixed-time', 'distance'].includes(activeTestEvent?.testConfig?.measureType))
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
                <div key={sId} className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-3 bg-white rounded border shadow-sm mb-2">
                  {/* LADO ESQUERDO: INFO ALUNO */}
                  <div className="d-flex align-items-center gap-3 w-100 w-md-auto">
                    <div className="flex-shrink-0">
                      <img
                        src={client.photo || placeholderAvatar}
                        alt={client.name}
                        className="rounded-circle border"
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      />
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="fw-bold text-dark fs-5">{client.name}</div>
                        {(client.friendlyId || client.idGym) && <span className="text-muted small">#{client.friendlyId || client.idGym}</span>}
                      </div>
                      <div className="d-flex gap-2 align-items-center mt-1">
                        {client.status && (
                          <Badge color={
                            client.status === 'active' ? 'success' :
                              client.status === 'suspended' ? 'warning' : 'secondary'
                          } className="border px-2 text-capitalize">
                            {client.status === 'active' ? 'Ativo' : client.status}
                          </Badge>
                        )}
                        {client.tag && <Badge color="light" className="text-muted border d-none d-md-inline-block">{client.tag}</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* LADO DIREITO: CONTROLES */}
                  <div className="d-flex flex-column flex-md-row align-items-center gap-2 gap-md-3 w-100 w-md-auto ms-auto">

                    {/* INPUT / DROPDOWN */}
                    <div className="w-100 w-md-auto" style={{ minWidth: '160px' }}>
                      <div className="d-md-none small text-muted text-uppercase fw-bold mb-1 text-center">
                        {isTechnicalTab ? "Atribuir Nível" : "Inserir Resultado"}
                      </div>

                      {isTechnicalTab ? (
                        <LevelDropdown
                          clientId={sId}
                          currentLevel={currentLevel}
                          onLevelChange={handleLevelChange}
                          levels={levels}
                          disabled={!selectedTopicId || isLoading("prefill") || !activeEvent}
                          fullWidth={true}
                          className="w-100 w-md-auto"
                          toggleClassName="w-100 py-2 py-md-1"
                        />
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <Input
                            placeholder={(['fixed-time', 'distance'].includes(activeTestEvent?.testConfig?.measureType)) ? "Metros" : "00:00:00"}
                            className="bg-light border-0 fw-bold text-center"
                            style={{ height: '38px', minWidth: '150px' }}
                            value={testDraft.result}
                            onChange={(e) => handleResultChange(sId, e.target.value)}
                            disabled={!activeTestEvent}
                          />
                        </div>
                      )}
                    </div>

                    {/* BOTÕES */}
                    <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-center">
                      <Button
                        color="success"
                        outline
                        className="d-flex align-items-center justify-content-center shadow-sm flex-grow-1 flex-md-grow-0"
                        style={{ height: '38px', minWidth: '42px' }}
                        onClick={() => sendEvaluationToClient(client)}
                        title="Enviar WhatsApp"
                      >
                        <i className="mdi mdi-whatsapp fs-4" />
                        <span className="ms-2 d-md-none fw-bold">Enviar</span>
                      </Button>

                      <Button
                        outline
                        color="danger"
                        className="d-flex align-items-center justify-content-center flex-grow-1 flex-md-grow-0 border-0"
                        style={{ height: '38px', minWidth: '42px' }}
                        onClick={() => toggleExcludeClient(sId)}
                        title="Remover da lista"
                      >
                        <i className="mdi mdi-close-circle-outline fs-4" />
                        <span className="ms-2 d-md-none fw-bold">Remover</span>
                      </Button>
                    </div>
                  </div>
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
        <div className="d-flex justify-content-end mt-4 pt-3 border-top gap-2">
          {isTechnicalTab ? (
            <>
              <Button
                color="success"
                outline
                onClick={sendAllEvaluations}
                disabled={isLoading("saveAll") || objectives.length === 0 || !activeEvent || evaluationClients.length === 0}
                className="px-4 shadow-sm d-flex align-items-center"
              >
                <i className="mdi mdi-whatsapp me-2" /> Enviar Todos
              </Button>
              <ButtonLoader
                color="success"
                onClick={saveEvaluations}
                loading={isLoading("saveAll")}
                disabled={isLoading("saveAll") || objectives.length === 0 || evaluationDirtyCount === 0 || !activeEvent}
                className="px-4 shadow-sm"
              >
                <i className="mdi mdi-check-all me-2" /> Salvar
              </ButtonLoader>
            </>
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

      {/* Modal de Progresso do Envio em Massa */}
      {sendingStatus.loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div className="bg-white rounded shadow-lg p-4" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="text-center mb-4">
              <div className="avatar-md mx-auto mb-3">
                <span className="avatar-title rounded-circle bg-soft-success text-success font-size-24">
                  <i className="mdi mdi-whatsapp"></i>
                </span>
              </div>
              <h5 className="font-size-16 fw-bold mb-1">Enviando Avaliações</h5>
              <p className="text-muted mb-0">Por favor, aguarde...</p>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between font-size-13 mb-1">
                <span className="fw-medium">{sendingStatus.step}</span>
                <span>{sendingStatus.progress}%</span>
              </div>
              <div className="progress progress-sm rounded-pill">
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${sendingStatus.progress}%`, transition: 'width 0.3s ease' }}
                  aria-valuenow={sendingStatus.progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>

            {sendingStatus.currentClientName && (
              <div className="text-center small text-muted mt-2">
                Processando: <strong>{sendingStatus.currentClientName}</strong>
              </div>
            )}
          </div>
        </div>
      )}
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
