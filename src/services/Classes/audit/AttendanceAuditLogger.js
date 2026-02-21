import { AuditService } from '../../Core/AuditService'

/**
 * Registra logs de auditoria relacionados a Presença/Chamada
 */
export const AttendanceAuditLogger = {
    /**
     * Registra auditoria após registrar ou atualizar a chamada de uma sessão
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {string} userId
     * @param {string} userName
     * @param {string} idSession
     * @param {boolean} isFirstAttendance
     * @param {number} presentCount
     * @param {number} absentCount
     * @param {number} totalClients
     * @param {number} enrollmentsUpdated
     */
    logAttendanceRecord: async (
        idTenant,
        idBranch,
        userId,
        userName,
        idSession,
        isFirstAttendance,
        presentCount,
        absentCount,
        totalClients,
        enrollmentsUpdated
    ) => {
        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: isFirstAttendance ? 'ATTENDANCE_RECORDED' : 'ATTENDANCE_UPDATED',
            entityType: 'session',
            entityId: idSession,
            description: `Chamada ${isFirstAttendance ? 'registrada' : 'atualizada'}: ${presentCount} presentes, ${absentCount} ausentes`,
            details: {
                presentCount,
                absentCount,
                totalClients,
                enrollmentsUpdated,
                isEdit: !isFirstAttendance
            }
        });
    }
}
