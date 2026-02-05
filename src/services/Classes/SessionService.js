import { sessionRepository } from '../../data/repositories/SessionRepository'
import { AuditService } from '../Core/AuditService'

/**
 * Serviço para Gestão de Sessões (Aulas Individuais)
 * 
 * Responsabilidades:
 * - CRUD de sessões
 * - Consultas por período, turma, etc
 * - Atualização de status de sessões
 */
export const SessionService = {
    /**
     * Lista sessões por intervalo de data
     */
    listByDateRange: async (idTenant, idBranch, startDate, endDate) => {
        return await sessionRepository.findByDateRange(idTenant, idBranch, startDate, endDate)
    },

    /**
     * Lista todas as sessões ativas
     */
    listActive: async (idTenant, idBranch) => {
        return await sessionRepository.findActive(idTenant, idBranch)
    },

    /**
     * Lista sessões de uma turma específica
     */
    listByClass: async (idTenant, idBranch, idClass) => {
        return await sessionRepository.findByClass(idTenant, idBranch, idClass)
    },

    /**
     * Busca uma sessão por ID
     */
    getById: async (idTenant, idBranch, idSession) => {
        return await sessionRepository.findById(idTenant, idBranch, idSession)
    },

    /**
     * Atualiza dados de uma sessão
     */
    update: async (idTenant, idBranch, user, idSession, data) => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const result = await sessionRepository.update(idTenant, idBranch, idSession, {
            ...data,
            updatedBy: userId
        })

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_UPDATED',
            entityType: 'session',
            entityId: idSession,
            description: `Sessão atualizada`,
            details: { changes: data }
        })

        return result
    },

    /**
     * Cancela uma sessão específica
     */
    cancelSession: async (idTenant, idBranch, user, idSession, reason = '') => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const result = await sessionRepository.update(idTenant, idBranch, idSession, {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: reason
        })

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CANCELLED',
            entityType: 'session',
            entityId: idSession,
            description: `Sessão cancelada: ${reason || 'Sem motivo informado'}`,
            details: { reason }
        })

        return result
    },

    /**
     * Cria uma sessão avulsa (fora da grade regular)
     */
    createExtraSession: async (idTenant, idBranch, user, sessionData) => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const result = await sessionRepository.create(idTenant, idBranch, {
            ...sessionData,
            isExtra: true,
            status: 'scheduled',
            createdBy: userId
        })

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CREATED',
            entityType: 'session',
            entityId: result.id,
            description: `Sessão avulsa criada para ${sessionData.sessionDate}`,
            details: sessionData
        })

        return result
    }
}
