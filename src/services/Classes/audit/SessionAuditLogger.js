import { AuditService } from '../../Core/AuditService'

/**
 * Registra logs de auditoria relacionados a Sessões (Aulas)
 */
export const SessionAuditLogger = {
    /**
     * Log de atualização manual de uma sessão
     */
    logUpdate: async ({ idTenant, idBranch, userId, userName, idSession, data }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_UPDATED',
            entityType: 'session',
            entityId: idSession,
            description: `Sessão ${idSession} alterada manualmente.`,
            details: { changes: data }
        })
    },

    /**
     * Log de cancelamento de uma sessão individual
     */
    logCancel: async ({ idTenant, idBranch, userId, userName, idSession, reason }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CANCELED',
            entityType: 'session',
            entityId: idSession,
            description: `Aula cancelada individualmente: ${reason || 'Sem motivo informado'}`,
            details: { reason }
        })
    },

    /**
     * Log de criação de sessão extra
     */
    logExtraSessionCreation: async ({ idTenant, idBranch, userId, userName, idSession, sessionDate, sessionData }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CREATED',
            entityType: 'session',
            entityId: idSession,
            description: `Sessão avulsa/extra criada para o dia ${sessionDate}`,
            details: sessionData
        })
    },

    /**
     * Log de salvamento de planejamento técnico da sessão
     */
    logPlanningSave: async ({ idTenant, idBranch, userId, userName, idSession, planningData }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_PLANNING_SAVED',
            entityType: 'session',
            entityId: idSession,
            description: `Planejamento salvo para a sessão ${idSession}`,
            details: planningData
        })
    },

    /**
     * Log de geração de planejamentos futuros em lote
     */
    logFuturePlanningGeneration: async ({ idTenant, idBranch, userId, userName, classId, sessionCount }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'FUTURE_PLANNING_GENERATED',
            entityType: 'class',
            entityId: classId,
            description: `Planejamento progressivo gerado para ${sessionCount} sessões.`,
            details: { classId, sessionCount }
        })
    }
}
