import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "reactstrap";
import WorkoutList from "./WorkoutList";
import TrainingForm from "./TrainingForm";
import { TrainingPlanService } from "../../../services/TrainingPlanning/trainingPlanning.service";
import PageLoader from "../../../components/Common/PageLoader";
import { toast } from "react-toastify";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";
import { toISODate } from "../../../utils/date";
import { useTenant } from "../../../hooks/useTenant";
import { useAuth } from "../../../hooks/useAuth";

const TrainingDayManager = ({ date }) => {
    const { idTenant, idBranch, isReady } = useTenant();
    const { user } = useAuth();

    const [viewMode, setViewMode] = useState("LIST"); // "LIST" or "FORM"
    const [workouts, setWorkouts] = useState([]);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [loading, setLoading] = useState(false);

    // Confirmation Dialog State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Load workouts for selected date
    const loadWorkouts = useCallback(async () => {
        if (!isReady || !date || !idTenant) {
            setWorkouts([]);
            return;
        }

        const dateStr = toISODate(date);

        try {
            setLoading(true);
            const data = await TrainingPlanService.listByDate(idTenant, idBranch, dateStr);
            setWorkouts(data);
        } catch (error) {
            console.error("Error loading workouts:", error);
            toast.error("Falha ao carregar os treinos do dia.");
        } finally {
            setLoading(false);
        }
    }, [date, idTenant, idBranch, isReady]);

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
        if (!deleteId || !idTenant) return;
        setDeleteModalOpen(false);

        try {
            setLoading(true);
            await TrainingPlanService.delete(idTenant, idBranch, user?.uid, user?.displayName, deleteId);
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
        if (!idTenant) return;

        try {
            setLoading(true);

            if (workoutData.id && selectedWorkout) {
                // Update
                await TrainingPlanService.update(idTenant, idBranch, user?.uid, user?.displayName, workoutData.id, workoutData);
                toast.success("Treino atualizado com sucesso.");
            } else {
                // Create
                const dateKey = toISODate(date);

                const payload = {
                    ...workoutData,
                    dateString: dateKey,
                };
                delete payload.id;

                await TrainingPlanService.create(idTenant, idBranch, user?.uid, user?.displayName, payload);

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
                <div className="h-100 d-flex align-items-center justify-content-center animate-fade-in" style={{ minHeight: '400px' }}>
                    <div className="text-center p-5 bg-white rounded-3 shadow-sm border" style={{ maxWidth: '400px' }}>
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                            style={{ width: '80px', height: '80px' }}>
                            <i className="mdi mdi-calendar-search text-primary" style={{ fontSize: '40px' }}></i>
                        </div>
                        <h5 className="fw-bold text-dark mb-2">Planejamento de Treinos</h5>
                        <p className="text-muted">Selecione uma data no calendário ao lado para gerenciar ou criar novos treinos.</p>
                    </div>
                </div>
            );
        }

        if (loading && viewMode === "LIST" && workouts.length === 0) {
            return (
                <Card className="h-100 shadow-sm border-0">
                    <CardBody className="d-flex align-items-center justify-content-center">
                        <PageLoader isFullScreen={false} />
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
                toggle={() => setDeleteModalOpen(!deleteModalOpen)}
                title="Excluir Treino"
                description="Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
                confirmColor="danger"
                onConfirm={handleConfirmDelete}
                loading={loading}
            />
        </React.Fragment>
    );
};

export default TrainingDayManager;
