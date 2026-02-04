import { sessionRepository } from '../../data/repositories/SessionRepository';
import { AuditService } from '../Audit/AuditService';
import { SessionSchema } from '../../data/schemas/Admin/SessionSchema';

/**
 * Serviço para Gestão de Sessões de Aulas (Sessions)
 */
export const SessionService = {
    /**
     * Lista sessões por intervalo de data
     */
    listByDateRange: async (idTenant, idBranch, startDate, endDate) => {
        return await sessionRepository.findByDateRange(idTenant, idBranch, startDate, endDate);
    },

    /**
     * Cria uma nova sessão
     */
    createSession: async (idTenant, idBranch, userId, sessionData) => {
        await SessionSchema.validate(sessionData, { abortEarly: false });

        const newSession = await sessionRepository.create(idTenant, idBranch, {
            ...sessionData,
            isActive: sessionData.isActive !== false,
            status: sessionData.status || 'scheduled',
            enrolledCount: sessionData.enrolledCount || 0,
            presentCount: 0,
            absentCount: 0,
            attendanceRecorded: sessionData.attendanceRecorded || false,
            attendanceSnapshot: null,
            createdBy: userId,
            createdAt: new Date(),
            deletedAt: null
        });

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: sessionData.userName,
            action: 'SESSION_CREATED',
            entityType: 'session',
            entityId: newSession.id,
            description: `Nova sessão criada para atividade ${sessionData.idActivity} em ${sessionData.sessionDate}`
        });

        return newSession;
    },

    /**
     * Atualiza uma sessão
     */
    updateSession: async (idTenant, idBranch, userId, id, data) => {
        const result = await sessionRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: new Date()
        });

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: data.userName,
            action: 'SESSION_UPDATED',
            entityType: 'session',
            entityId: id,
            description: `Sessão atualizada: ${id}`
        });

        return result;
    },

    /**
     * Grava presença para uma sessão
     */
    saveAttendance: async (idTenant, idBranch, userId, id, attendanceData) => {
        const result = await sessionRepository.update(idTenant, idBranch, id, {
            attendanceRecorded: true,
            attendanceSnapshot: attendanceData.clients,
            presentCount: attendanceData.presentCount,
            absentCount: attendanceData.absentCount,
            updatedAt: new Date()
        });

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: attendanceData.userName,
            action: 'ATTENDANCE_RECORDED',
            entityType: 'session',
            entityId: id,
            description: `Presença gravada para a sessão ${id}`
        });

        return result;
    },

    /**
     * Exclusão Lógica
     */
    deleteSession: async (idTenant, idBranch, userId, id, userName) => {
        const result = await sessionRepository.softDelete(idTenant, idBranch, id, userId);

        await AuditService.log({
            idTenant, idBranch, userId,
            userName,
            action: 'SESSION_DELETED',
            entityType: 'session',
            entityId: id,
            description: `Sessão excluída: ${id}`
        });

        return result;
    }
};
