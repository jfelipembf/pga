import React, { useMemo, useState } from "react"
import PropTypes from "prop-types"
import classNames from "classnames"
import {
  Badge,
  Button,
  Input,
  Col,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
} from "reactstrap"

import ButtonLoader from "../../../components/Common/ButtonLoader"


import { useAttendance } from "../Hooks/useAttendance"



const AttendanceModal = ({ isOpen, onClose, schedule, onAttendanceSaved, onEnrollmentChange }) => {
  const {
    clients,
    searchText,
    setSearchText,
    searchResults,
    isLoading,
    justAddedId,
    attendanceStats,
    handleSelectSearchClient,
    handleMarkAbsence,
    handleConfirmAbsence,
    handleMarkPresent,
    handleChangeJustification,
    handleSave,
    isDirty
  } = useAttendance(isOpen, schedule, onAttendanceSaved, onEnrollmentChange)

  const [showConfirm, setShowConfirm] = useState(false)

  const handleClose = () => {
    if (isDirty) {
      setShowConfirm(true)
    } else {
      onClose()
    }
  }

  const handleForceClose = () => {
    setShowConfirm(false)
    onClose()
  }

  const title = useMemo(() => {
    if (!schedule) return "Controle de presença"
    return `${schedule.activityName || "Turma"} · ${schedule.startTime} - ${schedule.endTime}`
  }, [schedule])


  return (
    <React.Fragment>
      <Modal
        isOpen={isOpen}
        toggle={handleClose}
        size="xl"
        centered
        backdrop="static"
        modalClassName="premium-modal"
        contentClassName="premium-modal__content"
      >
        <ModalHeader toggle={handleClose} className="premium-modal__header">
          <div className="d-flex align-items-center gap-2">
            <i className="mdi mdi-account-check-outline text-primary fs-4"></i>
            <div>
              <h5 className="mb-0 fw-bold">Controle de Presença</h5>
              <small className="text-muted fw-medium">{title}</small>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="premium-modal__body p-4" style={{ maxHeight: "78vh", overflowY: "auto" }}>
          {/* Class Info Card */}
          <div className="attendance-info-card mb-4">
            <Row className="align-items-center g-3">
              <Col lg={8}>
                <div className="d-flex flex-wrap gap-4 align-items-center">
                  <div className="info-item">
                    <div className="info-item__icon"><i className="mdi mdi-account-star"></i></div>
                    <div className="info-item__content">
                      <label>Professor</label>
                      <span>{schedule?.employeeName || "Não definido"}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-item__icon"><i className="mdi mdi-clock-outline"></i></div>
                    <div className="info-item__content">
                      <label>Horário</label>
                      <span>{schedule?.startTime} - {schedule?.endTime}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-item__icon"><i className="mdi mdi-map-marker-radius-outline"></i></div>
                    <div className="info-item__content">
                      <label>Local</label>
                      <span>{schedule?.areaName || "Geral"}</span>
                    </div>
                  </div>
                </div>
              </Col>
              <Col lg={4} className="text-lg-end">
                <div className="d-flex gap-3 justify-content-center">
                  <div className="attendance-stat is-present">
                    <span className="attendance-stat__value">{attendanceStats.present}</span>
                    <span className="attendance-stat__label">Presentes</span>
                  </div>
                  <div className="attendance-stat is-absent">
                    <span className="attendance-stat__value">{attendanceStats.absent}</span>
                    <span className="attendance-stat__label">Ausentes</span>
                  </div>
                  <div className="attendance-stat is-total">
                    <span className="attendance-stat__value">{attendanceStats.total}</span>
                    <span className="attendance-stat__label">Total</span>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Global Search */}
          <div className="mb-4">
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ms-3 z-index-10">
                {isLoading('addExtra') ? <ButtonLoader size="sm" /> : <i className="mdi mdi-magnify text-muted fs-4" />}
              </span>
              <Input
                className="form-control-lg border ps-5 shadow-sm"
                placeholder="Adicionar aluno à chamada (Nome, CPF ou ID)..."
                style={{ fontSize: '1rem' }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                disabled={isLoading('addExtra')}
              />
              {searchResults.length > 0 && (
                <div className="search-dropdown shadow-lg border rounded-3 mt-2">
                  {searchResults.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="search-dropdown__item"
                      onClick={() => handleSelectSearchClient(c)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-xs rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold">
                          {c.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{c.name}</div>
                          <div className="text-muted small">{c.idGym || "Sem ID"}</div>
                        </div>
                      </div>
                      <i className="mdi mdi-plus-circle-outline fs-4 text-primary opacity-50"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Row className="g-4">
            {/* List Section: Present */}
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="section-title mb-0">
                  <i className="mdi mdi-check-circle-outline text-success me-2"></i>
                  Lista de Presença
                </h6>
                <span className="badge bg-success-subtle text-success rounded-pill px-3">
                  {attendanceStats.present} Alunos
                </span>
              </div>

              <div className="attendance-list-container">
                {clients.filter(c => c.status !== "absent").length === 0 && (
                  <div className="text-center py-4 bg-light rounded-3 border border-dashed">
                    <p className="text-muted mb-0">Nenhum aluno marcado como presente.</p>
                  </div>
                )}
                <div className="d-flex flex-column gap-2">
                  {clients
                    .filter(c => c.status !== "absent")
                    .map(client => {
                      const isEditing = client.status === "editing"
                      return (
                        <div
                          key={client.id}
                          className={classNames("attendance-item", { "is-new": String(client.id) === String(justAddedId) })}
                        >
                          <div className="attendance-item__avatar">
                            {client.photo ? (
                              <img src={client.photo} alt={client.name} className="rounded-circle" />
                            ) : (
                              <div className="avatar-title rounded-circle bg-light text-secondary d-flex align-items-center justify-content-center h-100 w-100 border">
                                <i className="mdi mdi-account fs-3"></i>
                              </div>
                            )}
                            {['experimental', 'single-session'].includes(client.type) && (
                              <span className="badge-tag is-experimental" title="Experimental">EX</span>
                            )}
                          </div>

                          <div className="attendance-item__content">
                            <div className="d-flex align-items-center gap-2">
                              <div className="fw-bold text-dark fs-5">{client.name}</div>
                              {(client.friendlyId || client.idGym) && <span className="text-muted small">#{client.friendlyId || client.idGym}</span>}
                            </div>
                            <div className="d-flex gap-2 align-items-center mt-1">


                              {/* Status do Cliente */}
                              {client.clientStatus && (
                                <Badge color={
                                  client.clientStatus === 'active' ? 'success' :
                                    client.clientStatus === 'suspended' ? 'warning' : 'secondary'
                                } className="px-2">
                                  {client.clientStatus === 'active' ? 'Ativo' :
                                    client.clientStatus === 'suspended' ? 'Suspenso' :
                                      client.clientStatus === 'inactive' ? 'Inativo' : client.clientStatus}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="attendance-item__actions">
                            {isEditing ? (
                              <div className="d-flex gap-2 w-100">
                                <Input
                                  placeholder="Motivo da ausência..."
                                  className="form-control-sm"
                                  value={client.justification}
                                  onChange={e => handleChangeJustification(client.id, e.target.value)}
                                />
                                <Button color="success" size="sm" onClick={() => handleConfirmAbsence(client.id)}>
                                  <i className="mdi mdi-check"></i>
                                </Button>
                                <Button color="light" size="sm" onClick={() => handleMarkPresent(client.id)}>
                                  <i className="mdi mdi-close"></i>
                                </Button>
                              </div>
                            ) : (
                              <Button
                                color="danger"
                                outline
                                className="btn-sm px-3"
                                onClick={() => handleMarkAbsence(client.id)}
                              >
                                <i className="mdi mdi-account-minus-outline me-1"></i>
                                Faltou
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </Col>

            {/* List Section: Absent */}
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mt-2 mb-3">
                <h6 className="section-title mb-0">
                  <i className="mdi mdi-close-circle-outline text-danger me-2"></i>
                  Ausentes
                </h6>
                <span className="badge bg-danger-subtle text-danger rounded-pill px-3">
                  {attendanceStats.absent} Alunos
                </span>
              </div>

              <div className="attendance-list-container">
                {attendanceStats.absent === 0 && (
                  <div className="text-center py-4 bg-light rounded-3 border border-dashed opacity-50">
                    <p className="text-muted mb-0">Nenhum aluno marcado como ausente.</p>
                  </div>
                )}
                <div className="d-flex flex-column gap-2">
                  {clients
                    .filter(c => c.status === "absent")
                    .map(client => (
                      <div key={client.id} className="attendance-item is-absent">
                        <div className="attendance-item__avatar">
                          {client.photo ? (
                            <img src={client.photo} alt={client.name} className="rounded-circle" />
                          ) : (
                            <div className="avatar-title rounded-circle bg-light text-secondary d-flex align-items-center justify-content-center h-100 w-100 border">
                              <i className="mdi mdi-account fs-3"></i>
                            </div>
                          )}
                        </div>

                        <div className="attendance-item__content">
                          <div className="fw-bold text-dark fs-5">{client.name}</div>
                          {client.justification && (
                            <div className="text-danger small mt-1">
                              <i className="mdi mdi-comment-text-outline me-1"></i>
                              {client.justification}
                            </div>
                          )}
                        </div>

                        <div className="attendance-item__actions text-end">
                          <Button
                            color="success"
                            outline
                            className="btn-sm px-3"
                            onClick={() => handleMarkPresent(client.id)}
                          >
                            <i className="mdi mdi-account-plus-outline me-1"></i>
                            Presente
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </Col>
          </Row>
        </ModalBody>

        <div className="premium-modal__footer p-4 d-flex justify-content-between align-items-center bg-light border-top">
          <Button color="secondary" outline className="px-4">
            <i className="mdi mdi-whatsapp me-1"></i> Notificar Alunos
          </Button>
          <div className="d-flex gap-2">
            <Button color="light" className="px-4" onClick={handleClose}>
              Fechar
            </Button>
            <ButtonLoader
              color="primary"
              className="px-4 shadow-primary"
              onClick={() => handleSave(onClose)}
              loading={isLoading('save')}
              loadingText="Salvando..."
            >
              Salvar
            </ButtonLoader>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Unsaved Changes */}
      <Modal
        isOpen={showConfirm}
        toggle={() => setShowConfirm(false)}
        centered
        size="sm"
        contentClassName="border-0 shadow-lg"
      >
        <div className="p-4 text-center">
          <div className="mb-3">
            <div className="avatar-lg mx-auto">
              <div className="avatar-title bg-warning-subtle text-warning display-4 rounded-circle">
                <i className="mdi mdi-alert-outline"></i>
              </div>
            </div>
          </div>
          <h4 className="mb-2 fw-bold text-dark">Atenção!</h4>
          <p className="text-muted mb-4">
            Você realizou alterações na chamada que ainda não foram salvas.<br />
            Ao sair agora, <strong>todas as alterações serão perdidas.</strong>
          </p>

          <div className="d-flex gap-2 justify-content-center">
            <Button
              color="light"
              className="btn-rounded px-4 w-50"
              onClick={() => setShowConfirm(false)}
            >
              Voltar
            </Button>
            <Button
              color="danger"
              className="btn-rounded px-4 w-50 shadow-danger"
              onClick={handleForceClose}
            >
              Sair sem Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </React.Fragment >
  )
}

AttendanceModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  schedule: PropTypes.shape({
    activityName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    maxCapacity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    employeeName: PropTypes.string,
    areaName: PropTypes.string,
  }),
}

export default AttendanceModal
