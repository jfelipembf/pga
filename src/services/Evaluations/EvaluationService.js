import { evaluationRepository } from '../../data/repositories/EvaluationRepository'
import { ServiceContextHelper } from '../Core/DataAggregationHelper'
import { EvaluationRules } from './domain/EvaluationRules'
import { EvaluationAuditLogger } from './audit/EvaluationAuditLogger'

/**
 * Serviço para Gestão de Avaliações de Alunos
 */
export const EvaluationService = {
    /**
     * Registra uma nova avaliação
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {object} user - Usuário logado (avaliador)
     * @param {object} data - Dados da avaliação
     */
    registerEvaluation: async (idTenant, idBranch, user, data) => {
        // 1. Validar e formatar regras (domain)
        const validData = await EvaluationRules.validateForRegistration(data);

        // 2. Verificar se o aluno já foi avaliado nesta atividade dentro DESTE ciclo (idEvent)
        const existingEvaluation = await evaluationRepository.findByClientActivityEvent(
            idTenant, idBranch,
            validData.idClient,
            validData.idActivity,
            validData.idEvent
        )

        if (existingEvaluation) {
            // Caso já exista, atualizamos o documento existente (Edição)
            const updatePayload = EvaluationRules.buildUpdatePayload(validData, user);
            await evaluationRepository.update(idTenant, idBranch, existingEvaluation.id, updatePayload)

            // Log detalhado customizado de Edição no Ciclo
            await EvaluationAuditLogger.logUpdate(idTenant, idBranch, user, existingEvaluation.id, validData);

            return { id: existingEvaluation.id, ...updatePayload, isUpdate: true }
        }

        // 3. Caso contrário, criamos uma nova (Criação)
        const payload = EvaluationRules.buildCreationPayload(validData, user);

        const result = await evaluationRepository.create(idTenant, idBranch, payload)

        // Log de Criação
        await EvaluationAuditLogger.logCreation(idTenant, idBranch, user, result.id, payload);

        // AUTOMATION TRIGGER (Fire and forget)
        try {
            // Importação dinâmica para evitar ciclos e carregar apenas se necessário
            const { automationService } = await import('../Automation/AutomationService');

            // Buscar dados do aluno para contato via Helper
            const client = await ServiceContextHelper.getClientContext(idTenant, idBranch, payload.idClient);

            if (client) {
                // Dispara o evento
                automationService.emit(idTenant, 'EVALUATION_APPROVED', {
                    clientName: client.name,
                    clientId: client.id,
                    phone: client.mobile || client.whatsapp || client.phone, // Tenta várias fontes
                    responsavel: client.responsibleName || client.name,
                    levelId: payload.idLevel,
                    activityId: payload.idActivity,
                    evaluationId: result.id
                });
            }
        } catch (err) {
            console.warn('[EvaluationService] Automation Trigger Failed:', err);
        }

        return result
    },

    /**
     * Atualiza uma avaliação existente
     */
    updateEvaluation: async (idTenant, idBranch, user, idEvaluation, data) => {
        // 1. Snapshot Anterior (para Auditoria)
        const oldData = await evaluationRepository.findById(idTenant, idBranch, idEvaluation)
        if (!oldData) throw new Error("Avaliação não encontrada para atualização")

        const payload = EvaluationRules.buildDirectUpdatePayload(data, user);

        // 2. Persistir
        await evaluationRepository.update(idTenant, idBranch, idEvaluation, payload)

        // 3. Auditoria Detalhada (Antes vs Depois)
        await EvaluationAuditLogger.logDetailedUpdate(idTenant, idBranch, user, idEvaluation, oldData, payload);

        return true
    },

    /**
     * Lista avaliações de um aluno
     */
    getClientEvaluations: async (idTenant, idBranch, idClient) => {
        return await evaluationRepository.findByClient(idTenant, idBranch, idClient)
    },

    /**
     * Remove uma avaliação
     */
    deleteEvaluation: async (idTenant, idBranch, user, idEvaluation) => {
        // 1. Snapshot Antes de Deletar
        const oldData = await evaluationRepository.findById(idTenant, idBranch, idEvaluation)

        await evaluationRepository.delete(idTenant, idBranch, idEvaluation)

        // 2. Log de exclusão
        await EvaluationAuditLogger.logDeletion(idTenant, idBranch, user, idEvaluation, oldData);

        return true
    },

    /**
     * Busca as últimas avaliações registradas para uma lista de alunos em uma atividade específica.
     * Útil para pré-preencher o formulário de avaliação com o progresso anterior.
     */
    getLatestEvaluationsForClients: async (idTenant, idBranch, idActivity, clientIds) => {
        if (!clientIds || clientIds.length === 0) return {}

        // Busca todas as avaliações dessa atividade
        const evaluations = await evaluationRepository.findWhere(idTenant, idBranch, [
            ['idActivity', '==', idActivity],
            ['deletedAt', '==', null]
        ], { field: 'date', direction: 'desc' })

        const latestEvaluations = {}
        clientIds.forEach(clientId => {
            const clientEval = evaluations.find(e => e.idClient === clientId)
            if (clientEval) {
                latestEvaluations[clientId] = clientEval
            }
        })

        return latestEvaluations
    },

    /**
     * Busca todas as avaliações de um ciclo para uma atividade específica
     */
    getEvaluationsByActivityEvent: async (idTenant, idBranch, idActivity, idEvent) => {
        return await evaluationRepository.findWhere(idTenant, idBranch, [
            ['idActivity', '==', idActivity],
            ['idEvent', '==', idEvent],
            ['deletedAt', '==', null]
        ])
    },

    /**
     * Retorna a data da última avaliação registrada para uma turma
     */
    getLastClassEvaluationDate: async (idTenant, idBranch, idClass) => {
        try {
            // Busca a última avaliação atualizada ou criada na turma
            const result = await evaluationRepository.findWhere(idTenant, idBranch, [
                ['idClass', '==', idClass]
            ], { field: 'updatedAt', direction: 'desc' }, 1);

            if (result.length > 0) {
                const evalData = result[0];
                return evalData.updatedAt || evalData.createdAt || new Date(evalData.date);
            }
            return null;
        } catch (error) {
            console.error("Erro ao buscar última avaliação da turma:", error);
            return null;
        }
    }
}
