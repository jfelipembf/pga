import { auditRepository } from '../../data/repositories/AuditRepository'
import { normalizeDate } from '../../utils/date'

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
        userName,
        action,
        entityType,
        entityId,
        description,
        details = {},
        severity = 'INFO' // INFO, WARNING, CRITICAL
    }) => {
        try {
            const logData = {
                userId,
                userName: userName || null,
                action,
                entityType,
                entityId,
                description: description || '',
                details,
                severity,
                timestamp: normalizeDate(new Date()),
                metadata: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    url: window.location.href
                }
            }

            await auditRepository.log(idTenant, idBranch, logData)
            return true
        } catch (error) {
            console.error("Erro ao gravar log de auditoria:", error)
            return false
        }
    },

    /**
     * Registra um erro crítico no sistema para rastreamento técnico.
     */
    logError: async (idTenant, idBranch, userId, error, context = {}) => {
        return AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'SYSTEM_ERROR',
            entityType: 'technical_log',
            description: error.message || 'Erro desconhecido',
            severity: 'CRITICAL',
            details: {
                stack: error.stack,
                ...context
            }
        })
    },

    /**
     * Lista logs de auditoria com filtros simplificados.
     */
    listLogs: async (idTenant, idBranch, filters = {}, limitCount = 200) => {
        try {
            const whereClauses = [];

            if (filters.action && filters.action !== 'all') {
                whereClauses.push(['action', '==', filters.action]);
            }
            if (filters.entityType && filters.entityType !== 'all') {
                whereClauses.push(['entityType', '==', filters.entityType]);
            }
            if (filters.severity && filters.severity !== 'all') {
                whereClauses.push(['severity', '==', filters.severity]);
            }
            if (filters.userId && filters.userId !== 'all') {
                whereClauses.push(['userId', '==', filters.userId]);
            }

            // Filtro de Datas
            if (filters.startDate) {
                whereClauses.push(['timestamp', '>=', normalizeDate(filters.startDate)]);
            }
            if (filters.endDate) {
                whereClauses.push(['timestamp', '<=', normalizeDate(filters.endDate)]);
            }

            return await auditRepository.findWhere(
                idTenant,
                idBranch,
                whereClauses,
                { field: 'timestamp', direction: 'desc' },
                limitCount
            );
        } catch (error) {
            console.error("Erro ao buscar logs de auditoria:", error);
            return [];
        }
    }
}
