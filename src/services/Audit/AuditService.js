import { auditRepository } from '../../data/repositories/AuditRepository'

/**
 * Serviço de Auditoria para isolar a lógica de logs da UI.
 */
export const AuditService = {
    /**
     * Registra uma ação no sistema.
     * @param {Object} params
     * @param {string} params.idTenant
     * @param {string} params.idBranch
     * @param {string} params.userId
     * @param {string} params.action - Ex: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
     * @param {string} params.entityType - Ex: 'client', 'financial_record'
     * @param {string} params.entityId
     * @param {Object} params.details - Dados adicionais ou mudanças (antes/depois)
     */
    log: async ({
        idTenant,
        idBranch,
        userId,
        action,
        entityType,
        entityId,
        details = {}
    }) => {
        try {
            const logData = {
                userId,
                action,
                entityType,
                entityId,
                details,
                timestamp: new Date().toISOString(),
                metadata: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                }
            }

            await auditRepository.log(idTenant, idBranch, logData)
            return true
        } catch (error) {
            console.error("Erro ao gravar log de auditoria:", error)
            // Em produção, você pode querer enviar isso para um Sentry ou similar
            return false
        }
    }
}
