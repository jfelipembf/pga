import React, { useState } from "react";
import { Card, CardBody, Button, Badge } from "reactstrap";
import { formatDateDisplay } from "../../../utils/date";
import ClientSelectorModal from "./ClientSelectorModal";
import { toast } from "react-toastify";
import { TrainingPlanService } from "../../../services/TrainingPlanning/trainingPlanning";
import { useTenant } from "../../../hooks/useTenant";
import { useAuth } from "../../../hooks/useAuth";
import { MODALITIES, TRAINING_OBJECTIVES, TRAINING_PHASES } from "../constants/trainingConstants";

const WorkoutList = ({ date, workouts, onNewClick, onEditClick, onDeleteClick }) => {
    const { idTenant, idBranch } = useTenant();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    const formattedDate = date ? formatDateDisplay(date, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }) : "Selecione uma data";

    const handleShareClick = (workout) => {
        setSelectedWorkout(workout);
        setIsModalOpen(true);
    };

    const handleSendToclients = async (clients) => {
        if (!idTenant || !selectedWorkout) return;

        try {
            await TrainingPlanService.sendToclients(
                idTenant,
                idBranch,
                user.uid,
                user.displayName || user.email,
                clients,
                selectedWorkout
            );
            toast.success(`Treino enviado com sucesso para ${clients.length} alunos!`);
        } catch (error) {
            toast.error("Erro ao enviar treinos. Verifique a configuração da Evolution API.");
            console.error(error);
        }
    };

    const getObjectiveLabel = (value) => {
        const obj = TRAINING_OBJECTIVES.find(o => o.value === value);
        return obj ? obj.label : null;
    };

    const getModalityInfo = (value) => {
        return MODALITIES.find(m => m.value === value);
    };

    const getPhaseLabel = (value) => {
        const ph = TRAINING_PHASES.find(p => p.value === value);
        return ph ? ph.label : null;
    };

    return (
        <Card className="h-100 shadow-sm border-0">
            <CardBody className="p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-bottom pb-3 gap-3">
                    <h5 className="card-title text-primary mb-0">
                        <i className="mdi mdi-calendar-check me-2"></i>
                        Treinos do Dia
                    </h5>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                        <Badge
                            color="info"
                            className="p-2 font-size-12 text-wrap text-start"
                            style={{ maxWidth: '250px', lineHeight: '1.4' }}
                        >
                            <i className="mdi mdi-calendar me-1"></i>
                            {formattedDate}
                        </Badge>
                        <Button color="primary" size="sm" onClick={onNewClick} className="ms-auto ms-md-0">
                            <i className="mdi mdi-plus me-1"></i> Novo Treino
                        </Button>
                    </div>
                </div>

                {(workouts?.length || 0) === 0 ? (
                    <div className="text-center py-5 bg-light rounded-3 border border-dashed">
                        <h5 className="text-muted">Nenhum treino encontrado</h5>
                        <p className="text-muted mb-4">Não há treinos planejados para esta data.</p>
                        <Button color="primary" outline onClick={onNewClick}>
                            <i className="mdi mdi-plus me-1"></i> Criar Primeiro Treino
                        </Button>
                    </div>
                ) : (
                    <div className="workout-list" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                        {workouts?.map((workout, index) => {
                            const mod = getModalityInfo(workout.modality);
                            const objLabel = getObjectiveLabel(workout.objective);
                            const phaseLabel = getPhaseLabel(workout.phase);

                            return (
                                <div
                                    key={workout.id}
                                    className="d-flex align-items-center justify-content-between p-3 mb-3 bg-light rounded-3 border training-card-hover animate-fade-in"
                                    style={{
                                        animationDelay: `${index * 0.1}s`,
                                        borderLeft: mod ? `4px solid ${mod.color}` : undefined
                                    }}
                                >
                                    <div>
                                        <h5 className="font-size-14 mb-1 text-dark fw-bold">
                                            {workout.description || "Sem descrição"}
                                        </h5>
                                        <div className="text-muted small mb-1">
                                            <i className="mdi mdi-swim me-1"></i> {workout.totalDistance || 0}m
                                            <span className="mx-2">|</span>
                                            <i className="mdi mdi-format-list-bulleted me-1"></i> {workout.sections?.length || 0} seções
                                        </div>
                                        {(mod || objLabel || phaseLabel) && (
                                            <div className="d-flex flex-wrap gap-1 mt-1">
                                                {mod && (
                                                    <Badge color="light" className="text-dark font-size-10 px-2 py-1" style={{ border: `1px solid ${mod.color}` }}>
                                                        {mod.label}
                                                    </Badge>
                                                )}
                                                {objLabel && (
                                                    <Badge color="light" className="text-dark font-size-10 px-2 py-1">
                                                        🎯 {objLabel}
                                                    </Badge>
                                                )}
                                                {phaseLabel && (
                                                    <Badge color="light" className="text-muted font-size-10 px-2 py-1">
                                                        📅 {phaseLabel}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <i
                                            className="mdi mdi-whatsapp font-size-20 text-success cursor-pointer"
                                            onClick={() => handleShareClick(workout)}
                                            title="Enviar via WhatsApp"
                                            style={{ cursor: "pointer" }}
                                        ></i>
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
                            );
                        })}
                    </div>
                )}

                <ClientSelectorModal
                    isOpen={isModalOpen}
                    toggle={() => setIsModalOpen(!isModalOpen)}
                    onSend={handleSendToclients}
                    workout={selectedWorkout}
                />
            </CardBody>
        </Card>
    );
};

export default WorkoutList;
