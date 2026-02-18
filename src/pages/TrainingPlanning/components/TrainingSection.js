import React, { useState } from "react";
import { Card, CardBody, Button, Row, Col, Badge, Input } from "reactstrap";
import WorkoutItem from "./WorkoutItem";

const TrainingSection = ({ section, sectionIndex, onChange, onRemove, onAddItem, poolLength }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleChangeSectionName = (newName) => {
        onChange(sectionIndex, 'name', newName);
    };

    const handleChangeItem = (itemIndex, field, value) => {
        const items = section.items || [];
        const newItems = [...items];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
        onChange(sectionIndex, 'items', newItems);
    };

    const handleRemoveItem = (itemIndex) => {
        const items = section.items || [];
        const newItems = items.filter((_, i) => i !== itemIndex);
        onChange(sectionIndex, 'items', newItems);
    };

    const sectionItems = section.items || [];
    const sectionDistance = sectionItems.reduce((acc, item) => {
        const reps = parseInt(item.reps) || 0;
        const distance = parseInt(item.distance) || 0;
        return acc + (reps * distance);
    }, 0);

    return (
        <Card className="mb-4 border shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <div className={`p-3 d-flex align-items-center justify-content-between ${isCollapsed ? '' : 'border-bottom bg-light bg-opacity-25'}`}>
                <div className="d-flex align-items-center flex-grow-1">
                    <Button
                        color="link"
                        size="sm"
                        className="p-0 me-2 text-muted"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <i className={`mdi mdi-chevron-${isCollapsed ? 'right' : 'down'} fs-5`}></i>
                    </Button>

                    <Input
                        type="text"
                        value={section.name}
                        onChange={(e) => handleChangeSectionName(e.target.value)}
                        className="form-control-sm border-0 bg-transparent fw-bold text-dark p-0"
                        placeholder="Nome da seção (Ex: Parte Principal)"
                        style={{ maxWidth: '300px', fontSize: '1rem', boxShadow: 'none' }}
                    />

                    <div className="ms-3">
                        <Badge color="light" className="text-primary border border-primary border-opacity-25 px-2 py-1">
                            {sectionDistance}m
                        </Badge>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        color="link"
                        size="sm"
                        className="p-1 text-danger opacity-75 hover-opacity-100"
                        onClick={() => onRemove(sectionIndex)}
                        title="Remover seção"
                    >
                        <i className="mdi mdi-delete-outline fs-5"></i>
                    </Button>
                </div>
            </div>

            {!isCollapsed && (
                <CardBody className="p-0">
                    <div className="bg-white">
                        {/* Header das Séries - apenas para Desktop */}
                        {(section.items?.length || 0) > 0 && (
                            <Row className="mx-0 py-2 bg-light bg-opacity-50 text-muted small fw-bold text-uppercase border-bottom">
                                <Col md={1} className="ps-4">Qtd</Col>
                                <Col md={1}>Dist.</Col>
                                <Col md={3}>Exercício / Estilo</Col>
                                <Col md={2}>Intensidade</Col>
                                <Col md={2}>Material</Col>
                                <Col md={1}>Int.</Col>
                                <Col md={2}></Col>
                            </Row>
                        )}

                        <div className="section-items">
                            {(section.items?.length || 0) === 0 ? (
                                <div className="text-center py-4 bg-light bg-opacity-10 border-bottom mx-3 my-3 rounded border border-dashed">
                                    <p className="text-muted small mb-2">Sem séries nesta seção</p>
                                    <Button color="primary" outline size="sm" onClick={() => onAddItem(sectionIndex)}>
                                        + Adicionar Série
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {section.items?.map((item, itemIndex) => (
                                        <WorkoutItem
                                            key={item.id}
                                            index={itemIndex}
                                            item={item}
                                            onChange={handleChangeItem}
                                            onRemove={handleRemoveItem}
                                            poolLength={poolLength}
                                        />
                                    ))}
                                    <div className="p-3 border-bottom-0 bg-light bg-opacity-10">
                                        <Button
                                            color="primary"
                                            size="sm"
                                            outline
                                            className="border-0 fw-medium"
                                            onClick={() => onAddItem(sectionIndex)}
                                        >
                                            <i className="mdi mdi-plus-circle-outline me-1"></i>
                                            Adicionar Série
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CardBody>
            )}
        </Card>
    );
};

export default TrainingSection;
