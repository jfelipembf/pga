import React, { useEffect, useState, useCallback } from "react"
import { Button, Card, CardBody, CardHeader } from "reactstrap"
import { useObjectivesDragDrop } from "../hooks/useObjectivesDragDrop"
import ObjectivesViewMode from "./ObjectivesViewMode"
import ObjectivesEditMode from "./ObjectivesEditMode"

const ActivityObjectives = ({ objectives: externalObjectives = [], onChange, readOnly = false }) => {
  const [objectives, setObjectives] = useState(externalObjectives)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    setObjectives(externalObjectives || [])
  }, [externalObjectives])

  const updateObjectives = useCallback(updater => {
    const next = typeof updater === "function" ? updater(objectives) : updater
    setObjectives(next)
    setTimeout(() => onChange?.(next), 0)
  }, [objectives, onChange])

  // Drag and drop hook
  const dragDropHandlers = useObjectivesDragDrop(objectives, updateObjectives)

  // CRUD operations
  const addObjective = useCallback(() => {
    const id = `obj-${Date.now()}`
    updateObjectives(prev => [...prev, { id, title: "Novo objetivo", topics: [] }])
  }, [updateObjectives])

  const removeObjective = useCallback(id => {
    updateObjectives(prev => prev.filter(o => o.id !== id))
  }, [updateObjectives])

  const updateObjectiveTitle = useCallback((id, title) => {
    updateObjectives(prev => prev.map(o => (o.id === id ? { ...o, title } : o)))
  }, [updateObjectives])

  const addTopic = useCallback(objId => {
    const id = `top-${Date.now()}`
    updateObjectives(prev =>
      prev.map(o =>
        o.id === objId ? { ...o, topics: [...o.topics, { id, description: "Novo tópico" }] } : o
      )
    )
  }, [updateObjectives])

  const removeTopic = useCallback((objId, topicId) => {
    updateObjectives(prev =>
      prev.map(o =>
        o.id === objId ? { ...o, topics: o.topics.filter(t => t.id !== topicId) } : o
      )
    )
  }, [updateObjectives])

  const updateTopic = useCallback((objId, topicId, description) => {
    updateObjectives(prev =>
      prev.map(o =>
        o.id === objId
          ? { ...o, topics: o.topics.map(t => (t.id === topicId ? { ...t, description } : t)) }
          : o
      )
    )
  }, [updateObjectives])

  return (
    <Card className="shadow-sm">
      <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h5 className="mb-0">Objetivos e tópicos</h5>
          <p className="text-muted mb-0 small">Visualize ou edite a estrutura da atividade.</p>
        </div>

        {!readOnly && (
          <div className="d-flex gap-2">
            <Button color="light" size="sm" onClick={() => setEditMode(false)} active={!editMode}>
              Visualizar
            </Button>
            <Button color="primary" size="sm" onClick={() => setEditMode(true)} active={editMode}>
              Editar
            </Button>
          </div>
        )}
      </CardHeader>
      <CardBody>
        {editMode ? (
          <ObjectivesEditMode
            objectives={objectives}
            updateObjectiveTitle={updateObjectiveTitle}
            removeObjective={removeObjective}
            addTopic={addTopic}
            removeTopic={removeTopic}
            updateTopic={updateTopic}
            addObjective={addObjective}
            dragHandlers={dragDropHandlers}
            moveHandlers={{
              moveObjective: dragDropHandlers.moveObjective,
              moveTopic: dragDropHandlers.moveTopic
            }}
          />
        ) : (
          <ObjectivesViewMode objectives={objectives} />
        )}
      </CardBody>
    </Card >
  )
}

export default React.memo(ActivityObjectives)
