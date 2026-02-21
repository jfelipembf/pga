import { trainingPlanRepository } from "../../data/repositories/TrainingPlanRepository";
import { TrainingPlanAuditLogger } from "./audit/TrainingPlanAuditLogger";
import { automationService } from "../Automation/AutomationService";
import { formatTrainingForWhatsApp } from "../../pages/TrainingPlanning/utils/TrainingFormatter";
import { formatDate } from "../../utils/date";

/**
 * Service para Planejamento de Treinos.
 * Segue o padrão Multi-tenant e Auditable.
 */
export const TrainingPlanService = {
    /**
     * Lista planos de treino para uma data específica
     */
    listByDate: async (idTenant, idBranch, dateString) => {
        try {
            return await trainingPlanRepository.findByDate(idTenant, idBranch, dateString);
        } catch (error) {
            console.error("[TrainingPlanService] Erro ao listar treinos:", error);
            throw error;
        }
    },

    /**
     * Cria um novo plano de treino
     */
    create: async (idTenant, idBranch, userId, userName, data) => {
        const plan = await trainingPlanRepository.create(idTenant, idBranch, data);

        await TrainingPlanAuditLogger.logCreation({
            idTenant, idBranch, userId, userName,
            entityId: plan.id,
            description: data.description
        });

        return plan;
    },

    /**
     * Atualiza um plano de treino existente
     */
    update: async (idTenant, idBranch, userId, userName, planId, data) => {
        const oldData = await trainingPlanRepository.findById(idTenant, idBranch, planId);
        const updated = await trainingPlanRepository.update(idTenant, idBranch, planId, data);

        await TrainingPlanAuditLogger.logUpdate({
            idTenant, idBranch, userId, userName,
            entityId: planId,
            oldData,
            newData: { ...oldData, ...data }
        });

        return updated;
    },

    /**
     * Remove (soft delete) um plano de treino
     */
    delete: async (idTenant, idBranch, userId, userName, planId) => {
        const plan = await trainingPlanRepository.findById(idTenant, idBranch, planId);
        await trainingPlanRepository.softDelete(idTenant, idBranch, planId, userId);

        await TrainingPlanAuditLogger.logDeletion({
            idTenant, idBranch, userId, userName,
            entityId: planId,
            description: plan?.description
        });

        return true;
    },

    /**
     * Envia o treino para uma lista de alunos via WhatsApp
     */
    sendToclients: async (idTenant, idBranch, userId, userName, clients, workout) => {
        const workoutContent = formatTrainingForWhatsApp(workout);
        const date = formatDate(new Date());

        const promises = clients.map(client =>
            automationService.emit(idTenant, 'TRAINING_PLAN', {
                clientName: client.name,
                phone: client.phone || client.cellPhone || client.responsavelPhone,
                workoutContent,
                date
            })
        );

        await Promise.all(promises);

        await TrainingPlanAuditLogger.logShare({
            idTenant, idBranch, userId, userName,
            entityId: workout.id,
            workoutDescription: workout.description,
            clientCount: clients.length
        });

        return true;
    }
};
