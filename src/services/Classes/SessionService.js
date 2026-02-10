import { sessionRepository } from '../../data/repositories/SessionRepository'
import { AuditService } from '../Core/AuditService'
import { serverTimestamp } from 'firebase/firestore'
import { SessionFactory } from './SessionFactory'
import { SessionMapper } from './SessionMapper'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'

/**
 * Serviço para Gestão de Sessões (Aulas Individuais)
 * 
 * Responsabilidades:
 * - CRUD de sessões individuais
 * - Consultas por período, turma, etc
 * - Atualização de status e cancelamentos eventuais
 */
export const SessionService = {
    /**
     * Lista sessões por intervalo de data
     */
    listByDateRange: async (idTenant, idBranch, startDate, endDate) => {
        const raw = await sessionRepository.findByDateRange(idTenant, idBranch, startDate, endDate)
        return SessionMapper.toUIList(raw)
    },

    /**
     * Lista os alunos matriculados na turma dessa sessão
     */
    getStudentsForClass: async (idTenant, idBranch, idClass) => {
        return await enrollmentRepository.findByClass(idTenant, idBranch, idClass)
    },

    /**
     * Lista todas as sessões ativas
     */
    listActive: async (idTenant, idBranch) => {
        const raw = await sessionRepository.findActive(idTenant, idBranch)
        return SessionMapper.toUIList(raw)
    },

    /**
     * Lista sessões de uma turma específica
     */
    listByClass: async (idTenant, idBranch, idClass) => {
        const raw = await sessionRepository.findByClass(idTenant, idBranch, idClass)
        return SessionMapper.toUIList(raw)
    },

    /**
     * Busca uma sessão por ID
     */
    getById: async (idTenant, idBranch, idSession) => {
        return await sessionRepository.findById(idTenant, idBranch, idSession)
    },

    /**
     * Atualiza dados de uma sessão específica
     */
    update: async (idTenant, idBranch, user, idSession, data) => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const updateData = {
            ...data,
            updatedBy: userId,
            updatedAt: serverTimestamp()
        }

        const result = await sessionRepository.update(idTenant, idBranch, idSession, updateData)

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_UPDATED',
            entityType: 'session',
            entityId: idSession,
            description: `Sessão ${idSession} alterada manualmente.`,
            details: { changes: data }
        })

        return result
    },

    /**
     * Cancela uma sessão específica (Ex: Feriado ou falta do professor)
     */
    cancelSession: async (idTenant, idBranch, user, idSession, reason = '') => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const result = await sessionRepository.update(idTenant, idBranch, idSession, {
            status: 'canceled', // Padronizado com ClassService (um 'L')
            canceledAt: serverTimestamp(),
            canceledBy: userId,
            cancellationReason: reason,
            updatedBy: userId,
            updatedAt: serverTimestamp()
        })

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CANCELED',
            entityType: 'session',
            entityId: idSession,
            description: `Aula cancelada individualmente: ${reason || 'Sem motivo informado'}`,
            details: { reason }
        })

        return result
    },

    /**
     * Cria uma sessão extra fora da grade regular
     */
    createExtraSession: async (idTenant, idBranch, user, sessionData) => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const finalData = SessionFactory.create(
            idTenant, idBranch, userId,
            sessionData, sessionData.sessionDate,
            { isExtra: true }
        )

        const result = await sessionRepository.create(idTenant, idBranch, finalData)

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CREATED',
            entityType: 'session',
            entityId: result.id,
            description: `Sessão avulsa/extra criada para o dia ${sessionData.sessionDate}`,
            details: sessionData
        })

        return result
    }
}
