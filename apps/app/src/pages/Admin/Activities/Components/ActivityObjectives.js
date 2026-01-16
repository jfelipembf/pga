import React, { useEffect, useState } from "react"
import { Badge, Button, Card, CardBody, CardHeader, Col, Input, Row } from "reactstrap"

const ActivityObjectives = ({ objectives: externalObjectives = [], onChange }) => {
  const [objectives, setObjectives] = useState(externalObjectives)
  const [editMode, setEditMode] = useState(false)
  const [dragging, setDragging] = useState({ type: null, id: null, parent: null })

  useEffect(() => {
    setObjectives(externalObjectives || [])
  }, [externalObjectives])

  const updateObjectives = updater => {
    setObjectives(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater
      onChange?.(next)
      return next
    })
  }

  const addObjective = () => {
    const id = `obj-${Date.now()}`
    updateObjectives(prev => [...prev, { id, title: "Novo objetivo", topics: [] }])
  }

  const removeObjective = id => updateObjectives(prev => prev.filter(o => o.id !== id))

  const updateObjectiveTitle = (id, title) =>
    updateObjectives(prev => prev.map(o => (o.id === id ? { ...o, title } : o)))

  const addTopic = objId => {
    const id = `top-${Date.now()}`
    updateObjectives(prev =>
      prev.map(o =>
        o.id === objId ? { ...o, topics: [...o.topics, { id, description: "Novo tópico" }] } : o
      )
    )
  }

  const removeTopic = (objId, topicId) =>
    updateObjectives(prev =>
      prev.map(o =>
        o.id === objId ? { ...o, topics: o.topics.filter(t => t.id !== topicId) } : o
      )
    )

  const updateTopic = (objId, topicId, description) =>
    updateObjectives(prev =>
      prev.map(o =>
        o.id === objId
          ? { ...o, topics: o.topics.map(t => (t.id === topicId ? { ...t, description } : t)) }
          : o
      )
    )

  const handleDragStart = (type, id, parentId = null) => setDragging({ type, id, parent: parentId })

  const handleObjectiveDragOver = (e, overId) => {
    e.preventDefault()
    if (dragging.type !== "objective" || dragging.id === overId) return
    updateObjectives(prev => {
      const currentIndex = prev.findIndex(o => o.id === dragging.id)
      const overIndex = prev.findIndex(o => o.id === overId)
      const next = [...prev]
      const [moved] = next.splice(currentIndex, 1)
      next.splice(overIndex, 0, moved)
      return next
    })
  }

  const handleTopicDragOver = (e, objId, overId) => {
    e.preventDefault()
    if (dragging.type !== "topic" || dragging.parent !== objId || dragging.id === overId) return
    updateObjectives(prev =>
      prev.map(o => {
        if (o.id !== objId) return o
        const nextTopics = [...o.topics]
        const currentIndex = nextTopics.findIndex(t => t.id === dragging.id)
        const overIndex = nextTopics.findIndex(t => t.id === overId)
        const [moved] = nextTopics.splice(currentIndex, 1)
        nextTopics.splice(overIndex, 0, moved)
        return { ...o, topics: nextTopics }
      })
    )
  }

  const resetDrag = () => setDragging({ type: null, id: null, parent: null })

  const moveObjective = (id, direction) => {
    updateObjectives(prev => {
      const index = prev.findIndex(o => o.id === id)
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const moveTopic = (objId, topicId, direction) => {
    updateObjectives(prev =>
      prev.map(o => {
        if (o.id !== objId) return o
        const idx = o.topics.findIndex(t => t.id === topicId)
        const target = idx + direction
        if (target < 0 || target >= o.topics.length) return o
        const nextTopics = [...o.topics]
        const [moved] = nextTopics.splice(idx, 1)
        nextTopics.splice(target, 0, moved)
        return { ...o, topics: nextTopics }
      })
    )
  }

  const renderViewMode = () => (
    <div className="d-grid gap-3">
      {objectives.map((obj, index) => (
        <div key={obj.id} className="p-3 border rounded-3 bg-light">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Badge color="primary" pill>
              {String(index + 1).padStart(2, "0")}
            </Badge>
            <h6 className="mb-0">{obj.title}</h6>
          </div>
          <ul className="mb-0">
            {obj.topics.map((topic, tIndex) => (
              <li key={topic.id} className="mb-1">
                <span className="text-muted me-2">{index + 1}.{tIndex + 1}</span>
                {topic.description}
              </li>
            ))}
            {obj.topics.length === 0 && <li className="text-muted">Sem tópicos cadastrados.</li>}
          </ul>
        </div>
      ))}
    </div>
  )

  const renderEditMode = () => (
    <div className="d-grid gap-3">
      {objectives.map((obj, index) => (
        <div
          key={obj.id}
          className="p-3 border rounded-3"
          draggable
          onDragStart={() => handleDragStart("objective", obj.id)}
          onDragOver={e => handleObjectiveDragOver(e, obj.id)}
          onDragEnd={resetDrag}
          style={{ cursor: "grab" }}
        >
          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <Badge color="primary" pill>
              {String(index + 1).padStart(2, "0")}
            </Badge>
            <Input
              value={obj.title}
              onChange={e => updateObjectiveTitle(obj.id, e.target.value)}
              placeholder="Nome do objetivo"
              className="flex-grow-1"
            />
            <div className="d-flex align-items-center gap-1 ms-auto">
              <Button color="link" className="px-1 text-secondary" onClick={() => moveObjective(obj.id, -1)} title="Mover para cima">
                <i className="mdi mdi-arrow-up" />
              </Button>
              <Button color="link" className="px-1 text-secondary" onClick={() => moveObjective(obj.id, 1)} title="Mover para baixo">
                <i className="mdi mdi-arrow-down" />
              </Button>
              <Button color="link" className="text-danger px-2" onClick={() => removeObjective(obj.id)}>
                <i className="mdi mdi-trash-can-outline" />
              </Button>
            </div>
          </div>
          <div className="d-grid gap-1">
            {obj.topics.map((topic, tIndex) => (
              <Row
                key={topic.id}
                className="g-1 align-items-center"
                draggable
                onDragStart={() => handleDragStart("topic", topic.id, obj.id)}
                onDragOver={e => handleTopicDragOver(e, obj.id, topic.id)}
                onDragEnd={resetDrag}
                style={{ cursor: "grab" }}
              >
                <Col xs="3" sm="2" md="2" lg="1">
                  <Badge color="light" className="text-dark w-100">
                    {index + 1}.{tIndex + 1}
                  </Badge>
                </Col>
                <Col xs="7" sm="8" md="9" lg="10">
                  <Input
                    value={topic.description}
                    onChange={e => updateTopic(obj.id, topic.id, e.target.value)}
                    placeholder="Descrição do tópico"
                  />
                </Col>
                <Col xs="2" sm="2" md="1" className="text-end d-flex align-items-center justify-content-end gap-1">
                  <Button color="link" className="px-1 text-secondary" onClick={() => moveTopic(obj.id, topic.id, -1)} title="Mover para cima">
                    <i className="mdi mdi-arrow-up" />
                  </Button>
                  <Button color="link" className="px-1 text-secondary" onClick={() => moveTopic(obj.id, topic.id, 1)} title="Mover para baixo">
                    <i className="mdi mdi-arrow-down" />
                  </Button>
                  <Button color="link" className="text-danger px-2" onClick={() => removeTopic(obj.id, topic.id)}>
                    <i className="mdi mdi-delete-outline" />
                  </Button>
                </Col>
              </Row>
            ))}
            <Button color="light" size="sm" onClick={() => addTopic(obj.id)} className="d-inline-flex align-items-center gap-1">
              <i className="mdi mdi-plus" /> Adicionar tópico
            </Button>
          </div>
        </div>
      ))}
      <Button color="primary" outline onClick={addObjective} className="d-inline-flex align-items-center gap-2">
        <i className="mdi mdi-plus" /> Adicionar objetivo
      </Button>
    </div>
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h5 className="mb-0">Objetivos e tópicos</h5>
          <p className="text-muted mb-0 small">Visualize ou edite a estrutura da atividade.</p>
        </div>
        <div className="d-flex gap-2">
          <Button color="light" size="sm" onClick={() => setEditMode(false)} active={!editMode}>
            Visualizar
          </Button>
          <Button color="primary" size="sm" onClick={() => setEditMode(true)} active={editMode}>
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardBody>{editMode ? renderEditMode() : renderViewMode()}</CardBody>
    </Card>
  )
}

export default ActivityObjectives
