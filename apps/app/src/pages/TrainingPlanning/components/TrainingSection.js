import React, { useState } from "react";
import { Card, CardBody, Button, Row, Col, Badge, Input } from "reactstrap";
import WorkoutItem from "./WorkoutItem";

const TrainingSection = ({ section, sectionIndex, onChange, onRemove, onAddItem }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleChangeSectionName = (newName) => {
        onChange(sectionIndex, 'name', newName);
    };

    const handleChangeItem = (itemIndex, field, value) => {
        const newItems = [...section.items];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
        onChange(sectionIndex, 'items', newItems);
    };

    const handleRemoveItem = (itemIndex) => {
        const newItems = section.items.filter((_, i) => i !== itemIndex);
        onChange(sectionIndex, 'items', newItems);
    };

    const handleAddItemToSection = () => {
        onAddItem(sectionIndex);
    };

    // Calculate section distance
    const sectionDistance = section.items.reduce((acc, item) => {
        const reps = parseInt(item.reps) || 0;
        const distance = parseInt(item.distance) || 0;
        return acc + (reps * distance);
    }, 0);

    return (
        <Card className="mb-3 shadow-sm border-0">
            <CardBody className="p-3">
                {/* Section Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center flex-grow-1">
                        <Button
                            color="link"
                            size="sm"
                            className="p-0 me-2 text-muted"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <i className={`mdi mdi-chevron-${isCollapsed ? 'right' : 'down'} font-size-18`}></i>
                        </Button>
                        <Input
                            type="text"
                            value={section.name}
                            onChange={(e) => handleChangeSectionName(e.target.value)}
                            className="form-control-sm border-0 bg-light fw-bold"
                            placeholder="Nome da seção (ex: Aquecimento)"
                            style={{ maxWidth: '300px' }}
                        />
                        <Badge color="primary" className="ms-3 px-3 py-2">
                            {sectionDistance}m
                        </Badge>
                    </div>
                    <Button
                        color="danger"
                        size="sm"
                        outline
                        onClick={() => onRemove(sectionIndex)}
                        title="Remover seção"
                    >
                        <i className="mdi mdi-trash-can-outline"></i>
                    </Button>
                </div>

                {/* Section Content */}
                {!isCollapsed && (
                    <>
                        {/* Header Row */}
                        {section.items.length > 0 && (
                            <Row className="mb-2 text-muted small fw-bold text-uppercase d-none d-md-flex px-1">
                                <Col md={1}>Reps</Col>
                                <Col md={1}>Distância</Col>
                                <Col md={2}>Exercício</Col>
                                <Col md={2}>Estilo</Col>
                                <Col md={2}>Material</Col>
                                <Col md={2}>Intensidade</Col>
                                <Col md={1}>Int. (s)</Col>
                                <Col md={1}></Col>
                            </Row>
                        )}

                        {/* Items */}
                        <div className="section-items">
                            {section.items.length === 0 ? (
                                <div className="text-center py-3 bg-light rounded border border-dashed">
                                    <p className="text-muted mb-2 small">Nenhuma série nesta seção</p>
                                    <Button color="primary" size="sm" onClick={handleAddItemToSection}>
                                        <i className="mdi mdi-plus me-1"></i> Adicionar Série
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {section.items.map((item, itemIndex) => (
                                        <WorkoutItem
                                            key={item.id}
                                            index={itemIndex}
                                            item={item}
                                            onChange={handleChangeItem}
                                            onRemove={handleRemoveItem}
                                        />
                                    ))}
                                    <div className="text-center mt-2">
                                        <Button color="success" outline size="sm" onClick={handleAddItemToSection}>
                                            <i className="mdi mdi-plus me-1"></i> Adicionar Série
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default TrainingSection;
