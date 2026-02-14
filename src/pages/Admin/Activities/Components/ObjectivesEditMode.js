import React from "react"
import { Badge, Button, Col, Input, Row } from "reactstrap"

/**
 * Componente de edição dos objectives e topics
 */
const ObjectivesEditMode = ({
    objectives,
    updateObjectiveTitle,
    removeObjective,
    addTopic,
    removeTopic,
    updateTopic,
    addObjective,
    dragHandlers,
    moveHandlers
}) => {
    return (
        <div className="d-grid gap-3">
            {objectives.map((obj, index) => (
                <div
                    key={obj.id}
                    className="p-3 border rounded-3"
                    draggable
                    onDragStart={() => dragHandlers.handleDragStart("objective", obj.id)}
                    onDragOver={e => dragHandlers.handleObjectiveDragOver(e, obj.id)}
                    onDragEnd={dragHandlers.resetDrag}
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
                            <Button
                                color="link"
                                className="px-1 text-secondary"
                                onClick={() => moveHandlers.moveObjective(obj.id, -1)}
                                title="Mover para cima"
                            >
                                <i className="mdi mdi-arrow-up" />
                            </Button>
                            <Button
                                color="link"
                                className="px-1 text-secondary"
                                onClick={() => moveHandlers.moveObjective(obj.id, 1)}
                                title="Mover para baixo"
                            >
                                <i className="mdi mdi-arrow-down" />
                            </Button>
                            <Button
                                color="link"
                                className="text-danger px-2"
                                onClick={() => removeObjective(obj.id)}
                            >
                                <i className="mdi mdi-trash-can-outline" />
                            </Button>
                        </div>
                    </div>
                    <div className="d-grid gap-1">
                        {obj.topics.map((topic, tIndex) => (
                            <Row
                                key={topic.id}
                                className="g-2 align-items-center mb-2"
                                draggable
                                onDragStart={() => dragHandlers.handleDragStart("topic", topic.id, obj.id)}
                                onDragOver={e => dragHandlers.handleTopicDragOver(e, obj.id, topic.id)}
                                onDragEnd={dragHandlers.resetDrag}
                                style={{ cursor: "grab" }}
                            >
                                <Col xs="auto" style={{ width: '50px' }}>
                                    <Badge color="light" className="text-dark w-100">
                                        {index + 1}.{tIndex + 1}
                                    </Badge>
                                </Col>
                                <Col>
                                    <Input
                                        value={topic.description}
                                        onChange={e => updateTopic(obj.id, topic.id, 'description', e.target.value)}
                                        placeholder="Descrição do tópico"
                                    />
                                </Col>
                                <Col xs="auto" className="d-flex align-items-center">
                                    <Col xs="auto" className="d-flex align-items-center mb-0">
                                        <div
                                            className="form-check custom-checkbox mb-0 d-flex align-items-center"
                                            title="Item fundamental para aprovação de nível"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateTopic(obj.id, topic.id, 'isFundamental', !topic.isFundamental);
                                            }}
                                            onMouseDown={e => e.stopPropagation()}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id={`fund-${topic.id}`}
                                                checked={!!topic.isFundamental}
                                                onChange={() => { }} // Controlled by wrapper onClick
                                                style={{ cursor: 'pointer', width: '1.2rem', height: '1.2rem', marginTop: 0 }}
                                            />
                                            <label className="form-check-label ms-2 small fw-bold mb-0" htmlFor={`fund-${topic.id}`} style={{ cursor: 'pointer', lineHeight: '1.2rem' }}>
                                                Fund.
                                            </label>
                                        </div>
                                    </Col>
                                </Col>
                                <Col xs="auto" className="text-end d-flex align-items-center justify-content-end gap-1">
                                    <Button
                                        color="link"
                                        className="px-1 text-secondary"
                                        onClick={() => moveHandlers.moveTopic(obj.id, topic.id, -1)}
                                        title="Mover para cima"
                                    >
                                        <i className="mdi mdi-arrow-up" />
                                    </Button>
                                    <Button
                                        color="link"
                                        className="px-1 text-secondary"
                                        onClick={() => moveHandlers.moveTopic(obj.id, topic.id, 1)}
                                        title="Mover para baixo"
                                    >
                                        <i className="mdi mdi-arrow-down" />
                                    </Button>
                                    <Button
                                        color="link"
                                        className="text-danger px-2"
                                        onClick={() => removeTopic(obj.id, topic.id)}
                                    >
                                        <i className="mdi mdi-delete-outline" />
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                        <Button
                            color="light"
                            size="sm"
                            onClick={() => addTopic(obj.id)}
                            className="d-inline-flex align-items-center gap-1"
                        >
                            <i className="mdi mdi-plus" /> Adicionar tópico
                        </Button>
                    </div>
                </div>
            ))}
            <Button
                color="primary"
                outline
                onClick={addObjective}
                className="d-inline-flex align-items-center gap-2"
            >
                <i className="mdi mdi-plus" /> Adicionar objetivo
            </Button>
        </div>
    )
}

export default React.memo(ObjectivesEditMode)
