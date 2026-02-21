import { AuditService } from '../../Core/AuditService';

/**
 * Logger para auditoria de ações no Dashboard
 */
export const DashboardAuditLogger = {

    logSummaryRecalculated: async (idTenant, idBranch, userId, monthKey) => {
        return AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'dashboard_summary_recalculated',
            description: `Recalculou o resumo estatístico do mês ${monthKey}`,
            category: 'system',
            metadata: { monthKey }
        });
    },

    logSummaryUpdated: async (idTenant, idBranch, userId, monthKey, changes) => {
        return AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'dashboard_summary_updated',
            description: `Atualizou métricas no resumo do mês ${monthKey}`,
            category: 'system',
            metadata: { monthKey, changes }
        });
    }
};
