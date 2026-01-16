import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Row, Col, Badge } from "reactstrap";
import WorkoutItem from "./WorkoutItem";
import { calculateTotalDistance } from "../utils/trainingUtils";

const TrainingForm = ({ date, initialData, onSave, onBack }) => {
    const [workoutItems, setWorkoutItems] = useState(initialData?.items || []);
    const [totalDistance, setTotalDistance] = useState(initialData?.totalDistance || 0);
    const [description, setDescription] = useState(initialData?.description || "");

    useEffect(() => {
        // Recalculate total distance whenever items change
        setTotalDistance(calculateTotalDistance(workoutItems));
    }, [workoutItems]);
    // ... (omitting handleAddItem, handleRemoveItem, etc for brevity in this replace block if not changing logic, no I need to keep context)

    const handleAddItem = () => {
        setWorkoutItems([
            ...workoutItems,
            {
                id: Date.now(), // temporary ID
                reps: 1,
                distance: 50,
                style: null, // User will select
                intensity: null, // User will select
                equipment: [], // User will select
                interval: "",
                observation: ""
            },
        ]);
    };

    const handleChangeItem = (index, field, value) => {
        const newItems = [...workoutItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setWorkoutItems(newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = workoutItems.filter((_, i) => i !== index);
        setWorkoutItems(newItems);
    };

    const handleSave = () => {
        const workoutData = {
            id: initialData?.id || Date.now(), // Keep existing ID or create new
            date: date,
            description: description,
            items: workoutItems,
            totalDistance: totalDistance
        };
        onSave(workoutData);
    }

    const formattedDate = date ? date.toLocaleDateString("pt-BR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : "Selecione uma data";

    return (
        <Card className="h-100 shadow-sm border-0">
            <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <div className="d-flex align-items-center">
                        <Button color="light" size="sm" className="me-3" onClick={onBack}>
                            <i className="mdi mdi-arrow-left"></i>
                        </Button>
                        <h5 className="card-title text-primary mb-0">
                            <i className="mdi mdi-calendar-check me-2"></i>
                            {initialData ? "Editar Treino" : "Novo Treino"}
                        </h5>
                    </div>
                    <div className="d-flex align-items-center">
                        <Badge color="info" className="p-2 font-size-12">
                            <i className="mdi mdi-calendar me-1"></i>
                            {formattedDate}
                        </Badge>
                    </div>
                </div>

                {/* DESCRIPTION FIELD */}
                <div className="mb-4">
                    <label className="form-label text-muted text-uppercase font-size-11 fw-bold">Descrição do Treino</label>
                    <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0"
                        placeholder="Ex: Treino de Velocidade - Turma das 15h"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Header Row */}
                {workoutItems.length > 0 && (
                    <Row className="mb-2 text-muted small fw-bold text-uppercase d-none d-md-flex px-1">
                        <Col md={1}>Reps</Col>
                        <Col md={2}>Distância</Col>
                        <Col md={2}>Estilo</Col>
                        <Col md={2}>Meterial</Col>
                        <Col md={2}>Intensidade</Col>
                        <Col md={2}>Intervalo</Col>
                        <Col md={1}></Col>
                    </Row>
                )}

                <div className="workout-list mb-4" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto", overflowX: "hidden" }}>
                    {workoutItems.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded-3 border border-dashed">

                            <h5 className="text-muted">Nenhum treino planejado</h5>
                            <p className="text-muted mb-4">Selecione uma data e comece a adicionar séries ao treino.</p>
                            <Button color="primary" onClick={handleAddItem}>
                                <i className="mdi mdi-plus me-1"></i> Criar Nova Série
                            </Button>
                        </div>
                    ) : (
                        <>
                            {workoutItems.map((item, index) => (
                                <WorkoutItem
                                    key={item.id}
                                    index={index}
                                    item={item}
                                    onChange={handleChangeItem}
                                    onRemove={handleRemoveItem}
                                />
                            ))}

                            <div className="text-center mt-4">
                                <Button color="success" outline onClick={handleAddItem} size="sm">
                                    <i className="mdi mdi-plus me-1"></i> Adicionar Nova Série
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <div className="border-top pt-3">
                    <Row className="align-items-center">
                        <Col sm={6}>
                            <h5 className="mb-0">Total: {totalDistance}m</h5>
                        </Col>
                        <Col sm={6} className="text-end">
                            <Button color="secondary" outline className="me-2" onClick={handleAddItem}>
                                <i className="mdi mdi-plus me-1"></i> Adicionar Série
                            </Button>
                            <Button color="primary" onClick={handleSave} disabled={workoutItems.length === 0}>
                                <i className="mdi mdi-content-save-outline me-1"></i> Salvar Treino
                            </Button>
                        </Col>
                    </Row>
                </div>

            </CardBody>
        </Card>
    );
};

export default TrainingForm;
