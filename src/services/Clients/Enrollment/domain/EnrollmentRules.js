import { isPastDate } from '../../../../utils/date'
import { ENROLLMENT_TYPE, ENROLLMENT_STATUS } from '../../../../data/schemas/Clients/EnrollmentSchema'

/**
 * Regras de Negócio para Matrículas e Aulas Experimentais
 */
export const EnrollmentRules = {
    /**
     * Valida os dados antes de matricular o cliente em aulas regulares
     */
    validateRegularEnrollment: (idContract, classIds) => {
        if (!idContract) {
            throw new Error('Cliente deve ter um contrato ativo para realizar matrícula')
        }

        if (!classIds || classIds.length === 0) {
            throw new Error('Selecione ao menos uma turma para matrícula')
        }
    },

    /**
     * Valida se uma sessão pode receber um agendamento experimental
     */
    validateTrialClass: (session, existingEnrollments) => {
        // Valida Sessão Passada
        if (isPastDate(session.sessionDate)) {
            throw new Error('Não é possível agendar experimental em sessões passadas')
        }

        // Valida Lotação
        if (session.enrolledCount >= (session.maxCapacity || 999)) {
            throw new Error('Sessão já está com capacidade máxima')
        }

        // Valida se o cliente já tem uma aula experimental nessa mesma atividade (ou turma, no caso)
        const hasTrial = existingEnrollments.some(e =>
            e.enrollmentType === ENROLLMENT_TYPE.TRIAL &&
            e.idClass === session.idClass &&
            e.status === ENROLLMENT_STATUS.ACTIVE
        )

        if (hasTrial) {
            throw new Error('Cliente já possui uma aula experimental agendada para esta atividade')
        }
    }
}
