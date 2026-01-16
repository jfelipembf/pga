import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "reactstrap";
import WorkoutList from "./WorkoutList";
import TrainingForm from "./TrainingForm";
import {
    listTrainingPlans,
    createTrainingPlan,
    updateTrainingPlan,
    deleteTrainingPlan
} from "../../../services/TrainingPlanning/trainingPlanning.service";
import PageLoader from "../../../components/Common/PageLoader";
import { useToast } from "../../../components/Common/ToastProvider";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";
import { formatDateKey } from "../utils/trainingUtils";

const TrainingDayManager = ({ date }) => {
    const [viewMode, setViewMode] = useState("LIST"); // "LIST" or "FORM"
    const [workouts, setWorkouts] = useState([]);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [loading, setLoading] = useState(false);

    // Confirmation Dialog State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const { show } = useToast();

    // Load workouts for selected date
    const loadWorkouts = useCallback(async () => {
        if (!date) {
            setWorkouts([]);
            return;
        }

        const dateStr = formatDateKey(date);

        try {
            setLoading(true);
            const data = await listTrainingPlans(dateStr);
            setWorkouts(data);
        } catch (error) {
            console.error("Error loading workouts:", error);
            show({ title: "Erro", description: "Falha ao carregar os treinos do dia.", color: "danger" });
        } finally {
            setLoading(false);
        }
    }, [date, show]);

    useEffect(() => {
        loadWorkouts();
        setViewMode("LIST"); // Reset to list when date changes
    }, [loadWorkouts]);

    const handleNewClick = () => {
        setSelectedWorkout(null);
        setViewMode("FORM");
    };

    const handleEditClick = (workout) => {
        setSelectedWorkout(workout);
        setViewMode("FORM");
    };

    const handleDeleteRequest = (workoutId) => {
        setDeleteId(workoutId);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        setDeleteModalOpen(false);

        try {
            setLoading(true);
            await deleteTrainingPlan(deleteId);
            show({ title: "Sucesso", description: "Treino removido com sucesso.", color: "success" });

            // Update UI locally
            setWorkouts(prev => prev.filter(w => w.id !== deleteId));
        } catch (error) {
            console.error("Error deleting workout:", error);
            show({ title: "Erro", description: "Falha ao remover o treino.", color: "danger" });
            loadWorkouts(); // Reload to be safe
        } finally {
            setLoading(false);
            setDeleteId(null);
        }
    };

    const handleSaveWorkout = async (workoutData) => {
        try {
            setLoading(true);
            if (workoutData.id && selectedWorkout) {
                // Update
                await updateTrainingPlan(workoutData.id, workoutData);
                show({ title: "Atualizado", description: "Treino atualizado com sucesso.", color: "success" });
            } else {
                // Create
                const dateKey = formatDateKey(date);

                const payload = {
                    ...workoutData,
                    dateString: dateKey,
                    date: date // Pass Date object for service helper
                };
                delete payload.id;

                await createTrainingPlan(payload);

                show({ title: "Salvo", description: "Novo treino criado com sucesso.", color: "success" });
            }

            await loadWorkouts(); // Reload list
            setViewMode("LIST");
        } catch (error) {
            console.error("Error saving workout:", error);
            show({ title: "Erro", description: "Falha ao salvar o treino.", color: "danger" });
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setViewMode("LIST");
    };

    const renderContent = () => {
        if (!date) {
            return (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                    <div className="text-center">
                        <i className="mdi mdi-calendar-cursor font-size-24 mb-2 d-block"></i>
                        Selecione uma data no calendário ao lado.
                    </div>
                </div>
            );
        }

        if (loading && viewMode === "LIST" && workouts.length === 0) {
            return (
                <Card className="h-100 shadow-sm border-0">
                    <CardBody className="d-flex align-items-center justify-content-center">
                        <PageLoader minHeight="auto" />
                    </CardBody>
                </Card>
            );
        }

        if (viewMode === "FORM") {
            return (
                <TrainingForm
                    date={date}
                    initialData={selectedWorkout}
                    onSave={handleSaveWorkout}
                    onBack={handleBack}
                />
            );
        }

        return (
            <WorkoutList
                date={date}
                workouts={workouts}
                onNewClick={handleNewClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteRequest}
            />
        );
    };

    return (
        <React.Fragment>
            {renderContent()}

            <ConfirmDialog
                isOpen={deleteModalOpen}
                title="Excluir Treino"
                message="Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                confirmColor="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModalOpen(false)}
            />
        </React.Fragment>
    );
};

export default TrainingDayManager;
