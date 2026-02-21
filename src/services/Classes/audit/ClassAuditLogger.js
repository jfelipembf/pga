import { AuditService } from '../../Core/AuditService'

/**
 * Registra logs de auditoria relacionados a Turmas e Grades de Horário
 */
export const ClassAuditLogger = {
    /**
     * Log de criação de uma nova grade (múltiplas turmas e sessões)
     */
    logGradeCreation: async ({ idTenant, idBranch, userId, userName, createdClasses, formData }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'GRADE_CREATED',
            entityType: 'grade',
            entityId: 'multiple',
            description: `Grade criada com ${formData.weekdays.length} turmas e suas sessões.`,
            details: { createdClasses, formData }
        })
    },

    /**
     * Log de atualização de uma turma (e propagação para sessões)
     */
    logUpdate: async ({ idTenant, idBranch, userId, userName, idClass, oldData, newData }) => {
        return AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'class',
            entityId: idClass,
            oldData,
            newData,
            description: `Atualização atômica da turma ${idClass} e sessões propagadas.`
        })
    },

    /**
     * Log de exclusão de uma turma
     */
    logDeletion: async ({ idTenant, idBranch, userId, userName, idClass, fromDate, deletedSessionsCount }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'GRADE_CLASS_DELETED',
            entityType: 'class',
            entityId: idClass,
            description: fromDate
                ? `Turma ${idClass} excluída a partir de ${fromDate}. ${deletedSessionsCount} sessões canceladas.`
                : `Turma ${idClass} excluída completamente. ${deletedSessionsCount} sessões canceladas.`
        })
    }
}
