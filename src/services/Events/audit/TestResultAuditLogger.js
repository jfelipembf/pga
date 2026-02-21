import { AuditService } from '../../Core/AuditService'

export const TestResultAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, entityId, clientName, idEvent, result }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TEST_RESULT_CREATED',
            entityType: 'test_result',
            entityId,
            description: `Novo teste registrado: ${clientName} no ciclo ${idEvent}`,
            details: { result }
        })
    },

    logUpdate: async ({ idTenant, idBranch, userId, userName, entityId, clientName, idEvent, result }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TEST_RESULT_UPDATED',
            entityType: 'test_result',
            entityId,
            description: `Teste atualizado: ${clientName} no ciclo ${idEvent}`,
            details: { result }
        })
    }
}
