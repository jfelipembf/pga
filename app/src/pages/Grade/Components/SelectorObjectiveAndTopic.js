import React, { useMemo, useState } from "react"
import PropTypes from "prop-types"
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Row,
} from "reactstrap"

const placeholderAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6c757d">Aluno</text></svg>'
  )

const SelectorObjectiveAndTopic = ({
  isOpen,
  title,
  onClose,
  objectives = [],
  topics = [],
  selectedObjectiveId,
  selectedTopicId,
  onChangeObjective,
  onChangeTopic,
  onPrev,
  onNext,
  clients = [],
  levels = [],
  onSave,
  initialLevelsByclientId = {},
}) => {
  const [levelsByclientId, setLevelsByclientId] = useState(initialLevelsByclientId)

  const objectiveOptions = useMemo(() => (Array.isArray(objectives) ? objectives : []), [objectives])
  const topicOptions = useMemo(() => (Array.isArray(topics) ? topics : []), [topics])
  const clientList = useMemo(() => (Array.isArray(clients) ? clients : []), [clients])
  const levelOptions = useMemo(() => (Array.isArray(levels) ? levels : []), [levels])

  if (!isOpen) return null

  const handleChangeLevel = (idclient, idLevel) => {
    setLevelsByclientId(prev => ({ ...prev, [String(idclient)]: idLevel }))
  }

  const handleSave = () => {
    onSave?.({
      selectedObjectiveId,
      selectedTopicId,
      levelsByclientId,
    })
  }

  return (
    <div
      className="bg-white"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1055,
        overflow: "hidden",
      }}
    >
      <div className="border-bottom bg-white" style={{ position: "sticky", top: 0, zIndex: 2 }}>
        <Container fluid className="py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex flex-column">
              <div className="fw-bold">{title || "Planejamento"}</div>
              <div className="text-muted small">Selecione objetivo, tópico e nível por aluno</div>
            </div>

            <Button
              color="light"
              className="border d-flex align-items-center justify-content-center"
              style={{ width: 38, height: 38 }}
              type="button"
              onClick={onClose}
              aria-label="Fechar"
            >
              <i className="mdi mdi-close" style={{ fontSize: 18 }} />
            </Button>
          </div>

          <Row className="g-2 mt-2 align-items-end">
            <Col xs="12" lg="5">
              <label className="text-muted small fw-semibold mb-1">Objetivo</label>
              <Input
                type="select"
                value={selectedObjectiveId || ""}
                onChange={e => onChangeObjective?.(e.target.value)}
              >
                <option value="">Selecione...</option>
                {objectiveOptions.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.title || o.name}
                  </option>
                ))}
              </Input>
            </Col>

            <Col xs="12" lg="5">
              <label className="text-muted small fw-semibold mb-1">Tópico</label>
              <Input
                type="select"
                value={selectedTopicId || ""}
                onChange={e => onChangeTopic?.(e.target.value)}
              >
                <option value="">Selecione...</option>
                {topicOptions.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title || t.name}
                  </option>
                ))}
              </Input>
            </Col>

            <Col xs="12" lg="2" className="d-flex gap-2">
              <Button
                color="light"
                className="border flex-grow-1 d-flex align-items-center justify-content-center"
                type="button"
                onClick={onPrev}
              >
                <i className="mdi mdi-chevron-left" />
              </Button>
              <Button
                color="light"
                className="border flex-grow-1 d-flex align-items-center justify-content-center"
                type="button"
                onClick={onNext}
              >
                <i className="mdi mdi-chevron-right" />
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <div style={{ height: "calc(100vh - 170px)", overflowY: "auto" }}>
        <Container fluid className="py-3">
          <Card className="shadow-sm">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="fw-semibold">Alunos matriculados</div>
                <Badge color="secondary" pill>
                  {clientList.length}
                </Badge>
              </div>

              {clientList.length === 0 ? (
                <div className="text-muted">Nenhum aluno.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {clientList.map(client => {
                    const id = String(client?.id || client?.idClient || "")
                    const photo = client?.photo || client?.avatar || client?.clientAvatar || null
                    const tag = client?.idGym || client?.tag || client?.clientGymId || "CL"
                    const name =
                      client?.name ||
                      client?.clientName ||
                      `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
                      "Aluno"

                    const currentLevel = levelsByclientId[id] ?? ""

                    return (
                      <div
                        key={id}
                        className="d-flex flex-column flex-md-row align-items-md-center gap-3 px-3 py-3 border rounded bg-white"
                      >
                        <div
                          className="rounded-circle bg-light flex-shrink-0"
                          style={{
                            width: 52,
                            height: 52,
                            backgroundImage: `url(${photo || placeholderAvatar})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />

                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Badge color="light" className="text-muted border">
                              {tag}
                            </Badge>
                            <span className="text-muted small">{id}</span>
                          </div>
                          <div className="fw-semibold">{name}</div>
                        </div>

                        <div className="d-flex flex-column flex-sm-row align-items-stretch gap-2" style={{ minWidth: 220 }}>
                          <Input
                            type="select"
                            value={currentLevel}
                            onChange={e => handleChangeLevel(id, e.target.value)}
                          >
                            <option value="">Nível...</option>
                            {levelOptions.map(lvl => (
                              <option key={lvl.id} value={lvl.id}>
                                {lvl.title || lvl.name}
                              </option>
                            ))}
                          </Input>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>

      <div className="border-top bg-white" style={{ position: "sticky", bottom: 0, zIndex: 2 }}>
        <Container fluid className="py-2">
          <div className="d-flex justify-content-end gap-2">
            <Button color="light" className="border" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button color="primary" type="button" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </Container>
      </div>
    </div>
  )
}

SelectorObjectiveAndTopic.propTypes = {
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  onClose: PropTypes.func,
  objectives: PropTypes.array,
  topics: PropTypes.array,
  selectedObjectiveId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedTopicId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChangeObjective: PropTypes.func,
  onChangeTopic: PropTypes.func,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  clients: PropTypes.array,
  levels: PropTypes.array,
  onSave: PropTypes.func,
  initialLevelsByclientId: PropTypes.object,
}

export default SelectorObjectiveAndTopic
