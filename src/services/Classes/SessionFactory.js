import { serverTimestamp } from 'firebase/firestore'

/**
 * Factory para criação padronizada de documentos de Sessão (Aulas).
 * Garante que sessões da grade e sessões extras tenham a mesma estrutura.
 */
export const SessionFactory = {
    /**
     * Cria o objeto base de uma sessão.
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {string} userId 
     * @param {object} classData - Dados da turma (origem)
     * @param {string} sessionDate - Formato YYYY-MM-DD
     * @param {object} options - Overrides (status, isExtra, enrolledCount)
     */
    create: (idTenant, idBranch, userId, classData, sessionDate, options = {}) => {
        const sessionId = options.id || `${classData.id}-${sessionDate}`

        return {
            id: sessionId,
            idSession: sessionId,
            idClass: classData.id,
            idActivity: classData.idActivity,
            idArea: classData.idArea,
            idStaff: classData.idStaff,
            sessionDate,
            startTime: classData.startTime,
            endTime: classData.endTime,
            durationMinutes: classData.durationMinutes,
            weekday: classData.weekday,
            maxCapacity: classData.maxCapacity,
            enrolledCount: options.enrolledCount || 0,
            presentCount: 0,
            absentCount: 0,
            attendanceRecorded: false,
            status: options.status || 'scheduled',
            isActive: classData.isActive !== false,
            isExtra: options.isExtra || false,
            idTenant,
            idBranch,
            createdBy: userId,
            updatedBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            deletedAt: null
        }
    }
}
