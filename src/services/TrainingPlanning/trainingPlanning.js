import { trainingPlanRepository } from "../../data/repositories/TrainingPlanRepository";
import { AuditService } from "../Core/AuditService";
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
        try {
            const plan = await trainingPlanRepository.create(idTenant, idBranch, data);

            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName,
                action: 'TRAINING_PLAN_CREATED',
                entityType: 'training_plan',
                entityId: plan.id,
                description: `Criado plano de treino: ${data.description || 'Sem descrição'}`
            });

            return plan;
        } catch (error) {
            console.error("[TrainingPlanService] Erro ao criar treino:", error);
            throw error;
        }
    },

    /**
     * Atualiza um plano de treino existente
     */
    update: async (idTenant, idBranch, userId, userName, planId, data) => {
        try {
            const oldData = await trainingPlanRepository.findById(idTenant, idBranch, planId);
            const updated = await trainingPlanRepository.update(idTenant, idBranch, planId, data);

            await AuditService.logUpdate({
                idTenant,
                idBranch,
                userId,
                userName,
                entityType: 'training_plan',
                entityId: planId,
                oldData,
                newData: { ...oldData, ...data },
                description: `Atualizado plano de treino: ${data.description || oldData?.description}`
            });

            return updated;
        } catch (error) {
            console.error("[TrainingPlanService] Erro ao atualizar treino:", error);
            throw error;
        }
    },

    /**
     * Remove (soft delete) um plano de treino
     */
    delete: async (idTenant, idBranch, userId, userName, planId) => {
        try {
            const plan = await trainingPlanRepository.findById(idTenant, idBranch, planId);
            await trainingPlanRepository.softDelete(idTenant, idBranch, planId, userId);

            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName,
                action: 'TRAINING_PLAN_DELETED',
                entityType: 'training_plan',
                entityId: planId,
                description: `Removido plano de treino: ${plan?.description || 'Sem descrição'}`
            });

            return true;
        } catch (error) {
            console.error("[TrainingPlanService] Erro ao deletar treino:", error);
            throw error;
        }
    },

    /**
     * Envia o treino para uma lista de alunos via WhatsApp
     */
    sendToclients: async (idTenant, idBranch, userId, userName, clients, workout) => {
        try {
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

            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName,
                action: 'TRAINING_PLAN_SHARED',
                entityType: 'training_plan',
                entityId: workout.id,
                description: `Compartilhado treino "${workout.description}" com ${clients.length} alunos`
            });

            return true;
        } catch (error) {
            console.error("[TrainingPlanService] Erro ao enviar treinos:", error);
            throw error;
        }
    }
};
