import { evaluationRepository } from '../../data/repositories/EvaluationRepository'
import { EvaluationSchema } from '../../data/schemas/Evaluations/EvaluationSchema'
import { AuditService } from '../Audit/AuditService'

/**
 * Serviço para Gestão de Avaliações de Alunos
 */
export const EvaluationService = {
    /**
     * Registra uma nova avaliação
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {object} user - Usuário logado (avaliador)
     * @param {object} data - Dados da avaliação
     */
    registerEvaluation: async (idTenant, idBranch, user, data) => {
        // 1. Validar entrada
        const validData = await EvaluationSchema.validate(data, { abortEarly: false, stripUnknown: true })

        // 2. Preparar payload (adicionar metadados se necessário)
        const payload = {
            ...validData,
            createdBy: user.uid,
            createdByName: user.displayName || user.email,
        }

        // 3. Salvar no repositório
        const result = await evaluationRepository.create(idTenant, idBranch, payload)

        // 4. Auditoria
        await AuditService.log(idTenant, idBranch, user, 'EVALUATION_CREATED', {
            evaluationId: result.id,
            studentId: payload.idStudent,
            activityId: payload.idActivity
        })

        return result
    },

    /**
     * Atualiza uma avaliação existente
     */
    updateEvaluation: async (idTenant, idBranch, user, idEvaluation, data) => {
        // Validar parcialmente
        // (Pode-se criar um schema específico para update se necessário, por enquanto usamos o mesmo permitindo partial se implementado, mas o yup.validate padrão não aceita partial facilmente sem configurar. Vamos validar os campos enviados apenas se formos rigorosos, ou confiar no FE. Aqui validarei apenas o que for enviado se possível, mas o validate do yup valida tudo. Para update, geralmente validamos apenas os campos presentes ou assumimos que o FE envia tudo.)

        // Simplesmente passamos para o repo por hora, assumindo que a validação de regras de negócio ocorre no front ou aqui manualmente.
        // Se quiser validar schema no update: const validData = await EvaluationSchema.validate(data, { abortEarly: false }) - mas isso exige todos os campos required.

        const payload = {
            ...data,
            updatedBy: user.uid,
            updatedAt: new Date() // BaseRepo deve lidar com Data, mas forçamos aqui
        }

        await evaluationRepository.update(idTenant, idBranch, idEvaluation, payload)

        await AuditService.log(idTenant, idBranch, user, 'EVALUATION_UPDATED', {
            evaluationId: idEvaluation,
            changes: Object.keys(data)
        })

        return true
    },

    /**
     * Lista avaliações de um aluno
     */
    getStudentEvaluations: async (idTenant, idBranch, idStudent) => {
        return await evaluationRepository.findByStudent(idTenant, idBranch, idStudent)
    },

    /**
     * Remove uma avaliação
     */
    deleteEvaluation: async (idTenant, idBranch, user, idEvaluation) => {
        await evaluationRepository.delete(idTenant, idBranch, idEvaluation)

        await AuditService.log(idTenant, idBranch, user, 'EVALUATION_DELETED', {
            evaluationId: idEvaluation
        })

        return true
    }
}
