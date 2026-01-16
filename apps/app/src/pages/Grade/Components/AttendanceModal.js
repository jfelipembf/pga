import React, { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import {
  Badge,
  Button,
  Input,
  InputGroup,
  Col,
  InputGroupText,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
} from "reactstrap"

import { listEnrollmentsByClass } from "../../../services/Enrollments/enrollments.service"
import { listClients } from "../../../services/Clients"
import { addExtraParticipantToSession, getSessionAttendanceSnapshot, markAttendance, saveSessionSnapshot } from "../../../services/Attendance/attendance.service"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { useLoading } from "../../../hooks/useLoading"
import { useToast } from "../../../components/Common/ToastProvider"


const placeholderAvatar = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6c757d">Aluno</text></svg>'
)

const AttendanceModal = ({ isOpen, onClose, schedule, onAttendanceSaved, onEnrollmentChange }) => {
  const [clients, setclients] = useState([])
  const [searchText, setSearchText] = useState("")
  const [clientsCache, setClientsCache] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const { isLoading, withLoading } = useLoading()
  const [justAddedId, setJustAddedId] = useState(null)
  const toast = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !schedule?.id || !schedule?.idClass) return


      try {
        await withLoading('load', async () => {
          // 1. Sempre buscar snapshot diretamente do Firestore (fonte da verdade)
          const sessionDoc = await getSessionAttendanceSnapshot(schedule.id)
          if (sessionDoc?.attendanceRecorded && Array.isArray(sessionDoc.attendanceSnapshot) && sessionDoc.attendanceSnapshot.length) {
            const normalizedFromSnapshot = sessionDoc.attendanceSnapshot.map(s => ({
              ...s,
              id: s.idClient,
              tag: s.tag || "CL",
              photo: s.photo || null,
              enrollmentId: s.enrollmentId || null,
              status: s.status || "present",
              justification: s.justification || "",
            }))
            setclients(normalizedFromSnapshot)
          } else {
            // Se não tem snapshot, buscar matrículas ativas da turma
            const enrollments = await listEnrollmentsByClass(schedule.idClass, {
              sessionDate: schedule.sessionDate || schedule.startDate || schedule.date || null,
            })
            if (Array.isArray(enrollments)) {
              // Buscar dados completos dos clientes para obter avatar/foto
              const clientIds = [...new Set(enrollments.map(e => e.idClient).filter(Boolean))]
              const clientsMap = new Map()
              if (clientIds.length) {
                try {
                  const clients = await listClients()
                  if (Array.isArray(clients)) {
                    clients.forEach(c => {
                      if (c.id && clientIds.includes(c.id)) {
                        clientsMap.set(c.id, c)
                      }
                    })
                  }
                } catch (e) {
                  console.warn("Erro ao buscar clientes para avatar", e)
                }
              }

              const clientsData = enrollments.map(e => {
                const client = clientsMap.get(e.idClient) || {}
                const firstName = e.firstName || e.clientFirstName || client.firstName || ""
                const lastName = e.lastName || e.clientLastName || client.lastName || ""
                const fullName = e.name || e.clientName || e.fullName || client.name || `${firstName} ${lastName}`.trim() || ""
                return {
                  id: e.idClient,
                  tag: "CL",
                  photo: client.photo || e.photo || null,
                  enrollmentId: e.idEnrollment || e.id,
                  status: "present",
                  justification: "",
                  firstName,
                  lastName,
                  name: fullName || "Aluno sem nome",
                  type: e.type,
                }
              })
              setclients(clientsData)
            }
          }
        })
      } catch (err) {
        console.error("Erro ao carregar dados de presença", err)
      }
    }
    loadData()
  }, [isOpen, schedule, withLoading])

  useEffect(() => {
    const q = String(searchText || "").trim().toLowerCase()
    if (!isOpen) return
    if (q.length < 2) {
      setSearchResults([])
      return
    }

    const run = async () => {
      try {
        // Carrega uma vez e filtra localmente (melhor UX e evita múltiplas consultas)
        let base = clientsCache
        if (!base.length) {
          base = await listClients()
          setClientsCache(base || [])
        }

        const results = (base || [])
          .filter(c => {
            const name = String(c?.name || "").toLowerCase()
            const idGym = String(c?.idGym || "").toLowerCase()
            const cpf = String(c?.cpf || "").toLowerCase()
            return name.includes(q) || idGym.includes(q) || cpf.includes(q)
          })
          .slice(0, 8)

        setSearchResults(results)
      } catch (e) {
        console.error("Erro ao buscar clientes", e)
      }
    }

    run()
  }, [searchText, isOpen, clientsCache])

  useEffect(() => {
    if (!justAddedId) return
    const t = setTimeout(() => setJustAddedId(null), 900)
    return () => clearTimeout(t)
  }, [justAddedId])

  const handleAddExtraClient = async (client) => {
    if (!client?.id || !schedule?.id) return

    const idClient = String(client.id)
    if (clients.some(s => String(s.id) === idClient)) {
      // Já está na lista, não faz nada
      return
    }

    const extraParticipant = {
      idClient,
      name: client.name || `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Aluno",
      tag: client.idGym || "CL",
      photo: client.photo || null,
    }

    try {
      await withLoading('addExtra', async () => {
        const nextExtra = await addExtraParticipantToSession(schedule.id, extraParticipant)

        // Notify parent to update occupancy badge immediately
        onEnrollmentChange?.({
          idSession: schedule.id,
          action: 'add',
          type: 'extra'
        })

        void nextExtra
      })
    } catch (e) {
      console.error("Erro ao adicionar reposição na sessão", e)
    }
  }

  const handleSelectSearchClient = (client) => {
    if (!client?.id) return
    const idClient = String(client.id)

    // Limpar imediatamente o input e resultados
    setSearchText("")
    setSearchResults([])

    // Adicionar de forma otimista à lista (UX suave)
    setclients(prev => {
      if (prev.some(s => String(s.id) === idClient)) return prev

      const newclient = {
        id: idClient,
        enrollmentId: null,
        name: client.name || `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Aluno",
        tag: client.idGym || "CL",
        photo: client.photo || null,
        status: "present",
        justification: "",
        isExtra: true,
      }

      return [...prev, newclient]
    })

    setJustAddedId(idClient)

    // Adicionar o cliente
    handleAddExtraClient(client)
  }

  const handleMarkAbsence = id => {
    setclients(prev =>
      prev.map(s => (s.id === id ? { ...s, status: "editing", justification: "" } : s))
    )
  }

  const handleConfirmAbsence = (idClient) => {
    setclients(prev => prev.map(s => (s.id === idClient ? { ...s, status: "absent" } : s)))
  }

  const handleMarkPresent = (idClient) => {
    setclients(prev => prev.map(s => (s.id === idClient ? { ...s, status: "present", justification: "" } : s)))
  }

  const handleSave = async () => {
    if (!schedule?.id) return
    try {
      await withLoading('save', async () => {
        const presentList = clients.filter(s => s.status !== "absent")
        const absentList = clients.filter(s => s.status === "absent")
        const presentCount = presentList.length
        const absentCount = absentList.length

        // Salvar snapshot completo (assinatura do service: { clients, presentCount, absentCount })
        await saveSessionSnapshot(schedule.id, {
          clients: clients.map(s => ({
            idClient: s.id,
            enrollmentId: s.enrollmentId || null,
            name: s.name || "Aluno",
            tag: s.tag || "CL",
            photo: s.photo || null,
            status: s.status || "present",
            justification: s.justification || "",
            isExtra: Boolean(s.isExtra),
          })),
          presentCount,
          absentCount,
        })

        // Marcar presenças individuais
        const attendancePromises = clients
          .filter(s => s.status !== "editing") // não salvar status temporários
          .map(client => ({
            idSession: schedule.id,
            idClient: client.id,
            idClass: schedule.idClass, // ← garantir idClass
            sessionDate: schedule.sessionDate || schedule.startDate || new Date().toISOString().slice(0, 10), // ← garantir sessionDate
            idEnrollment: client.enrollmentId,
            status: client.status,
            justification: client.justification,
            type: client.type || null,
            recordedAt: new Date().toISOString(),
          }))

        await Promise.all(attendancePromises.map(p => markAttendance(p)))

        toast.show({
          title: "Presenças salvas",
          description: `${presentCount} presentes, ${absentCount} ausentes`,
          color: "success"
        })

        onAttendanceSaved?.({
          idSession: schedule.id,
          clients: clients.map(s => ({
            idClient: s.id,
            enrollmentId: s.enrollmentId || null,
            name: s.name || "Aluno",
            tag: s.tag || "CL",
            photo: s.photo || null,
            status: s.status || "present",
            justification: s.justification || "",
            isExtra: Boolean(s.isExtra),
          })),
          presentCount,
          absentCount,
        })
        onClose()
      })
    } catch (err) {
      console.error("Erro ao salvar presenças", err)
      toast.show({
        title: "Erro ao salvar presenças",
        description: err?.message || "Tente novamente",
        color: "danger"
      })
    }
  }

  const presentCount = clients.filter(s => s.status !== "absent").length
  const absentCount = clients.filter(s => s.status === "absent").length

  const title = useMemo(() => {
    if (!schedule) return "Controle de presença"
    return `${schedule.activityName || "Turma"} · ${schedule.startTime} - ${schedule.endTime}`
  }, [schedule])

  const handleChangeJustification = (id, text) => {
    setclients(prev => prev.map(s => (s.id === id ? { ...s, justification: text } : s)))
  }


  return (
    <Modal
      isOpen={isOpen}
      toggle={onClose}
      size="xl"
      centered
      backdrop="static"
      modalClassName="basic-modal"
      contentClassName="basic-modal__content"
    >
      <ModalHeader toggle={onClose} className="border-bottom-0 pb-0">{title}</ModalHeader>
      <ModalBody className="basic-modal__body attendance-modal__body" style={{ maxHeight: "72vh" }}>
        <div className="attendance-modal__summary mb-4 p-3 bg-light rounded border">
          <Row className="align-items-center g-3">
            <Col md={8}>
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <div
                  className="rounded px-3 py-2 text-white fw-bold shadow-sm"
                  style={{ backgroundColor: schedule?.color || "#3c5068", fontSize: "1.1rem" }}
                >
                  {schedule?.activityName || "Turma"}
                </div>
                <div className="d-flex flex-column">
                  <span className="text-muted small text-uppercase fw-bold">Professor</span>
                  <span className="fw-semibold" style={{ fontSize: "1rem" }}>{schedule?.employeeName || "Não definido"}</span>
                </div>
                <div className="vr mx-2 d-none d-md-block" style={{ height: "30px" }}></div>
                <div className="d-flex flex-column">
                  <span className="text-muted small text-uppercase fw-bold">Horário</span>
                  <span className="fw-semibold" style={{ fontSize: "1rem" }}>{schedule?.startTime} - {schedule?.endTime}</span>
                </div>
                <div className="vr mx-2 d-none d-md-block" style={{ height: "30px" }}></div>
                <div className="d-flex flex-column">
                  <span className="text-muted small text-uppercase fw-bold">Local</span>
                  <span className="fw-semibold" style={{ fontSize: "1rem" }}>{schedule?.areaName || "Geral"}</span>
                </div>
              </div>
            </Col>
            <Col md={4} className="text-md-end border-start-md">
              <div className="d-inline-flex flex-column align-items-md-end">
                <span className="text-muted small text-uppercase fw-bold mb-1">Ocupação da Turma</span>
                <div className="d-flex gap-2 align-items-center">
                  <Badge color="success" style={{ fontSize: "0.9rem", padding: "8px 12px" }}>
                    {presentCount} Presentes
                  </Badge>
                  <Badge color="danger" style={{ fontSize: "0.9rem", padding: "8px 12px" }}>
                    {absentCount} Ausentes
                  </Badge>
                  <Badge color="secondary" className="outline" style={{ fontSize: "0.9rem", padding: "8px 12px" }}>
                    Total {clients.length}/{schedule?.maxCapacity}
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <h6 className="mb-0 fw-bold">Pesquisar alunos</h6>
          </div>
          <InputGroup className="shadow-sm">
            <InputGroupText className="bg-white border-end-0">
              {isLoading('addExtra') ? <ButtonLoader size="sm" /> : <i className="mdi mdi-magnify text-muted" />}
            </InputGroupText>
            <Input
              className="border-start-0 ps-0"
              placeholder="Pesquise por nome, CPF ou GymID para adicionar à chamada de hoje..."
              style={{ padding: "12px" }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              disabled={isLoading('addExtra')}
            />
          </InputGroup>

          {searchResults.length > 0 && (
            <div className="border rounded mt-2 bg-white shadow-sm" style={{ overflow: "hidden" }}>
              {searchResults.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className="w-100 text-start px-3 py-2 border-0 bg-white"
                  onClick={() => handleSelectSearchClient(c)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-semibold">{c.name || "Cliente"}</div>
                      <div className="text-muted" style={{ fontSize: "0.85rem" }}>{c.idGym || "--"}</div>
                    </div>
                    <span className="text-muted" style={{ fontSize: "0.85rem" }}>Adicionar</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="attendance-modal__list">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Presentes</h6>
            <span className="badge bg-dark">{presentCount}</span>
          </div>

          <div className="d-flex flex-column gap-2">
            {clients
              .filter(client => client.status !== "absent")
              .map(client => {
                const isEditing = client.status === "editing"
                const hasJustification = client.justification?.trim()
                return (
                  <div
                    key={client.id}
                    className="d-flex align-items-center gap-3 px-3 py-3 border rounded bg-white shadow-sm"
                    style={
                      String(client.id) === String(justAddedId)
                        ? {
                          backgroundColor: "#e6ffed",
                          transform: "scale(1.01)",
                          transition: "background-color 700ms ease, transform 250ms ease",
                        }
                        : { transition: "background-color 700ms ease, transform 250ms ease" }
                    }
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
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge color="light" className="text-muted border">{client.tag}</Badge>
                        {['experimental', 'single-session'].includes(client.type) && (
                          <Badge color="info" className="ms-1">Experimental</Badge>
                        )}
                      </div>
                      <div className="fw-semibold">{client.name}</div>
                    </div>

                    {isEditing ? (
                      <div className="d-flex align-items-center gap-2 w-50">
                        <Input
                          placeholder="Justificativa"
                          value={client.justification}
                          onChange={e => handleChangeJustification(client.id, e.target.value)}
                        />
                        <ButtonLoader
                          color="success"
                          outline
                          className="d-flex align-items-center justify-content-center"
                          disabled={!hasJustification || isLoading('save')}
                          onClick={() => handleConfirmAbsence(client.id)}
                          title="Confirmar justificativa"
                        >
                          <i className="mdi mdi-check" />
                        </ButtonLoader>
                        <ButtonLoader color="light" onClick={() => handleMarkPresent(client.id)} title="Cancelar" loading={isLoading('save')}>
                          <i className="mdi mdi-close" />
                        </ButtonLoader>
                      </div>
                    ) : (
                      <ButtonLoader
                        color="danger"
                        outline
                        className="d-flex align-items-center gap-2"
                        onClick={() => handleMarkAbsence(client.id)}
                        disabled={isLoading('save')}
                      >
                        <i className="mdi mdi-thumb-down-outline" />
                        Marcar ausência
                      </ButtonLoader>
                    )}
                  </div>
                )
              })}
          </div>

          <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
            <h6 className="mb-0">Ausentes</h6>
            <span className="badge bg-dark">{absentCount}</span>
          </div>

          <div className="d-flex flex-column gap-2">
            {absentCount === 0 && (
              <div className="text-muted small px-3 py-2">Nenhum aluno ausente.</div>
            )}
            {clients
              .filter(client => client.status === "absent")
              .map(client => {
                const hasJustification = client.justification?.trim()
                return (
                  <div
                    key={client.id}
                    className="d-flex align-items-center gap-3 px-3 py-3 border rounded bg-white shadow-sm"
                    style={
                      String(client.id) === String(justAddedId)
                        ? {
                          backgroundColor: "#e6ffed",
                          transform: "scale(1.01)",
                          transition: "background-color 700ms ease, transform 250ms ease",
                        }
                        : { transition: "background-color 700ms ease, transform 250ms ease" }
                    }
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
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge color="light" className="text-muted border">{client.tag}</Badge>
                        <Badge color="success" pill className="text-uppercase">
                          {client.tag}
                        </Badge>
                        {['experimental', 'single-session'].includes(client.type) && (
                          <Badge color="info" className="ms-1">Experimental</Badge>
                        )}
                        {hasJustification && (
                          <>
                            <i
                              className="mdi mdi-information-outline text-info"
                              id={`info-${client.id}`}
                              style={{ cursor: "pointer" }}
                              title={client.justification}
                            />
                          </>
                        )}
                      </div>
                      <div className="fw-semibold">{client.name}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge color="danger" className="text-uppercase">Ausente</Badge>
                      <ButtonLoader size="sm" color="light" onClick={() => handleMarkPresent(client.id)} loading={isLoading('save')}>
                        Marcar presente
                      </ButtonLoader>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="attendance-modal__footer d-flex justify-content-between align-items-center border-top mt-3">
          <Button color="primary" outline>
            Enviar mensagem
          </Button>
          <div className="d-flex gap-2">
            <ButtonLoader color="light" onClick={onClose} loading={isLoading('save')}>
              Cancelar
            </ButtonLoader>
            <ButtonLoader color="primary" onClick={handleSave} loading={isLoading('save')}>
              Salvar
            </ButtonLoader>
          </div>
        </div>
      </ModalBody>
    </Modal>
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
