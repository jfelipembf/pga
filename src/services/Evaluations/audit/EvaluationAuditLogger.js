import { AuditService } from '../../Core/AuditService'

/**
 * Registra logs de auditoria relacionados a Avaliações
 */
export const EvaluationAuditLogger = {
    /**
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {object} user 
     * @param {string} entityId 
     * @param {object} evalData 
     */
    logCreation: async (idTenant, idBranch, user, entityId, evalData) => {
        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVALUATION_CREATED',
            entityType: 'evaluation',
            entityId: entityId,
            description: `Nova avaliação registrada para o aluno ID ${evalData.idClient} no ciclo ${evalData.idEvent}`,
            details: { clientId: evalData.idClient, activityId: evalData.idActivity }
        });
    },

    /**
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {object} user 
     * @param {string} entityId 
     * @param {object} evalData 
     */
    logUpdate: async (idTenant, idBranch, user, entityId, evalData) => {
        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVALUATION_UPDATED',
            entityType: 'evaluation',
            entityId: entityId,
            description: `Avaliação do aluno ID ${evalData.idClient} atualizada dentro do ciclo ${evalData.idEvent}`,
            details: { clientId: evalData.idClient, activityId: evalData.idActivity }
        });
    },

    /**
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {object} user 
     * @param {string} entityId 
     * @param {object} oldData 
     * @param {object} newData 
     */
    logDetailedUpdate: async (idTenant, idBranch, user, entityId, oldData, newData) => {
        await AuditService.logUpdate({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            entityType: 'evaluation',
            entityId: entityId,
            oldData,
            newData,
            description: `Atualizou a avaliação do aluno ID ${oldData.idClient}`
        });
    },

    /**
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {object} user 
     * @param {string} entityId 
     * @param {object} oldData 
     */
    logDeletion: async (idTenant, idBranch, user, entityId, oldData) => {
        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVALUATION_DELETED',
            entityType: 'evaluation',
            entityId: entityId,
            description: oldData
                ? `Excluiu a avaliação do aluno ID ${oldData.idClient} na atividade ${oldData.idActivity}`
                : `Avaliação ${entityId} removida`,
            details: {
                snapshot: oldData || "Dados não encontrados antes da exclusão"
            }
        });
    }
}
