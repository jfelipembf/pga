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
import { toast } from "react-toastify";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";
import { toISODate } from "../../../utils/date";

const TrainingDayManager = ({ date }) => {
    const [viewMode, setViewMode] = useState("LIST"); // "LIST" or "FORM"
    const [workouts, setWorkouts] = useState([]);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [loading, setLoading] = useState(false);

    // Confirmation Dialog State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Load workouts for selected date
    const loadWorkouts = useCallback(async () => {
        if (!date) {
            setWorkouts([]);
            return;
        }

        const dateStr = toISODate(date);

        try {
            setLoading(true);
            const data = await listTrainingPlans(dateStr);
            setWorkouts(data);
        } catch (error) {
            console.error("Error loading workouts:", error);
            toast.error("Falha ao carregar os treinos do dia.");
        } finally {
            setLoading(false);
        }
    }, [date]);

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
            toast.success("Treino removido com sucesso.");

            // Update UI locally
            setWorkouts(prev => prev.filter(w => w.id !== deleteId));
        } catch (error) {
            console.error("Error deleting workout:", error);
            toast.error("Falha ao remover o treino.");
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
                toast.success("Treino atualizado com sucesso.");
            } else {
                // Create
                const dateKey = toISODate(date);

                const payload = {
                    ...workoutData,
                    dateString: dateKey,
                    date: date // Pass Date object for service helper
                };
                delete payload.id;

                await createTrainingPlan(payload);

                toast.success("Novo treino criado com sucesso.");
            }

            await loadWorkouts(); // Reload list
            setViewMode("LIST");
        } catch (error) {
            console.error("[TrainingDayManager] Error saving workout:", error);
            toast.error("Falha ao salvar o treino.");
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
