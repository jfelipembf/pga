import { AuditService } from '../../../Core/AuditService'

export const EnrollmentAuditLogger = {
    logEnrollmentCreated: async ({ idTenant, idBranch, userId, userName, newEnrollment, clientName, classData, idClass }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ENROLLMENT_CREATED',
            entityType: 'enrollment',
            entityId: newEnrollment.id,
            description: `${clientName} matriculado(a) na turma ${classData?.name || idClass} `
        })
    },

    logTrialScheduled: async ({ idTenant, idBranch, userId, userName, newEnrollment, clientName, sessionId }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TRIAL_SCHEDULED',
            entityType: 'enrollment',
            entityId: newEnrollment.id,
            description: `Aula experimental agendada para ${clientName} na sessão ${sessionId} `
        })
    },

    logEnrollmentCancelled: async ({ idTenant, idBranch, userId, userName, enrollmentId, clientName, affectedSessionsCount }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ENROLLMENT_CANCELLED',
            entityType: 'enrollment',
            entityId: enrollmentId,
            description: `Matrícula de ${clientName} cancelada em ${affectedSessionsCount} sessões.`
        })
    }
}
