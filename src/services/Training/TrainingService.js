import { trainingRepository } from "../../data/repositories/TrainingRepository";
import { messagingService } from "../Automation/MessagingService";
import { formatTrainingMessage } from "./TrainingFormatter";
import { integrationRepository } from "../../data/repositories/Automation/IntegrationRepository";

export const TrainingService = {
    getTrainings: async (idTenant, idBranch) => {
        return await trainingRepository.findActive(idTenant, idBranch);
    },

    getTrainingById: async (idTenant, idBranch, id) => {
        return await trainingRepository.findById(idTenant, idBranch, id);
    },

    saveTraining: async (idTenant, idBranch, data) => {
        if (data.id) {
            return await trainingRepository.update(idTenant, idBranch, data.id, data);
        }
        return await trainingRepository.create(idTenant, idBranch, data);
    },

    deleteTraining: async (idTenant, idBranch, id, userId) => {
        return await trainingRepository.softDelete(idTenant, idBranch, id, userId);
    },

    /**
     * Envia o treino para o aluno via WhatsApp
     */
    shareViaWhatsApp: async (idTenant, studentPhone, training) => {
        const message = formatTrainingMessage(training);

        // Buscar configurações de integração do Evolution API
        const config = await integrationRepository.getSettings(idTenant);

        if (!config || !config.evolutionInstanceName) {
            throw new Error("Configuração do WhatsApp não encontrada. Verifique as integrações.");
        }

        return await messagingService.sendText(idTenant, studentPhone, message, config);
    }
};
