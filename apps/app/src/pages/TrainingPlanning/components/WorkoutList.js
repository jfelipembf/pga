import React from "react";
import { Card, CardBody, Button, Badge } from "reactstrap";

const WorkoutList = ({ date, workouts, onNewClick, onEditClick, onDeleteClick }) => {
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
                    <h5 className="card-title text-primary mb-0">
                        <i className="mdi mdi-calendar-check me-2"></i>
                        Treinos do Dia
                    </h5>
                    <div className="d-flex align-items-center">
                        <Badge color="info" className="p-2 font-size-12 me-3">
                            <i className="mdi mdi-calendar me-1"></i>
                            {formattedDate}
                        </Badge>
                        <Button color="primary" size="sm" onClick={onNewClick}>
                            <i className="mdi mdi-plus me-1"></i> Novo Treino
                        </Button>
                    </div>
                </div>

                {workouts.length === 0 ? (
                    <div className="text-center py-5 bg-light rounded-3 border border-dashed">
                        <h5 className="text-muted">Nenhum treino encontrado</h5>
                        <p className="text-muted mb-4">Não há treinos planejados para esta data.</p>
                        <Button color="primary" outline onClick={onNewClick}>
                            <i className="mdi mdi-plus me-1"></i> Criar Primeiro Treino
                        </Button>
                    </div>
                ) : (
                    <div className="workout-list" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                        {workouts.map((workout) => (
                            <div key={workout.id} className="d-flex align-items-center justify-content-between p-3 mb-3 bg-light rounded-3 border">
                                <div>
                                    <h5 className="font-size-14 mb-1 text-dark fw-bold">
                                        {workout.description || "Sem descrição"}
                                    </h5>
                                    <div className="text-muted small">
                                        <i className="mdi mdi-swim me-1"></i> {workout.totalDistance}m
                                        <span className="mx-2">|</span>
                                        <i className="mdi mdi-format-list-bulleted me-1"></i> {workout.items.length} séries
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <i
                                        className="mdi mdi-pencil font-size-18 text-primary cursor-pointer"
                                        onClick={() => onEditClick(workout)}
                                        title="Editar"
                                        style={{ cursor: "pointer" }}
                                    ></i>
                                    <i
                                        className="mdi mdi-trash-can-outline font-size-18 text-danger cursor-pointer"
                                        onClick={() => onDeleteClick(workout.id)}
                                        title="Excluir"
                                        style={{ cursor: "pointer" }}
                                    ></i>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default WorkoutList;
