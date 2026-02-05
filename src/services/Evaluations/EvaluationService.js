import { evaluationRepository } from '../../data/repositories/EvaluationRepository'
import { EvaluationSchema } from '../../data/schemas/Evaluations/EvaluationSchema'
import { AuditService } from '../Core/AuditService'

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
        // 1. Validar se há um evento ativo para avaliação
        if (!data.idEvent) {
            throw new Error("Não é possível registrar avaliações fora de um período (ciclo) ativo.")
        }

        // 2. Validar entrada
        const validData = await EvaluationSchema.validate(data, { abortEarly: false, stripUnknown: true })

        // 3. Verificar se o aluno já foi avaliado nesta atividade dentro DESTE ciclo (idEvent)
        const existingEvaluation = await evaluationRepository.findByStudentActivityEvent(
            idTenant, idBranch,
            validData.idStudent,
            validData.idActivity,
            validData.idEvent
        )

        if (existingEvaluation) {
            // Caso já exista, atualizamos o documento existente (Edição)
            const updatePayload = {
                ...validData,
                updatedBy: user.uid,
                updatedByName: user.displayName || user.email,
                updatedAt: new Date()
            }
            await evaluationRepository.update(idTenant, idBranch, existingEvaluation.id, updatePayload)

            await AuditService.log({
                idTenant, idBranch,
                userId: user.uid,
                userName: user.displayName || user.email,
                action: 'EVALUATION_UPDATED',
                entityType: 'evaluation',
                entityId: existingEvaluation.id,
                description: `Avaliação do aluno ID ${validData.idStudent} atualizada dentro do ciclo ${validData.idEvent}`,
                details: { studentId: validData.idStudent, activityId: validData.idActivity }
            })

            return { id: existingEvaluation.id, ...updatePayload, isUpdate: true }
        }

        // 4. Caso contrário, criamos uma nova (Criação)
        const payload = {
            ...validData,
            createdBy: user.uid,
            createdByName: user.displayName || user.email,
        }

        const result = await evaluationRepository.create(idTenant, idBranch, payload)

        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVALUATION_CREATED',
            entityType: 'evaluation',
            entityId: result.id,
            description: `Nova avaliação registrada para o aluno ID ${payload.idStudent} no ciclo ${payload.idEvent}`,
            details: { studentId: payload.idStudent, activityId: payload.idActivity }
        })

        // AUTOMATION TRIGGER (Fire and forget)
        try {
            // Importação dinâmica para evitar ciclos e carregar apenas se necessário
            const { clientRepository } = await import('../../data/repositories/ClientRepository');
            const { automationService } = await import('../Automation/AutomationService');

            // Buscar dados do aluno para contato
            const student = await clientRepository.findById(idTenant, idBranch, payload.idStudent);

            if (student) {
                // Dispara o evento
                automationService.emit(idTenant, 'EVALUATION_APPROVED', {
                    studentName: student.name,
                    studentId: student.id,
                    phone: student.mobile || student.whatsapp || student.phone, // Tenta várias fontes
                    responsavel: student.responsibleName || student.name,
                    levelId: payload.idLevel,
                    activityId: payload.idActivity,
                    evaluationId: result.id
                });
            }
        } catch (err) {
            console.warn('[EvaluationService] Automation Trigger Failed:', err);
        }

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

        await AuditService.log({
            idTenant,
            idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVALUATION_UPDATED',
            entityType: 'evaluation',
            entityId: idEvaluation,
            description: `Avaliação ${idEvaluation} atualizada`,
            details: {
                changes: Object.keys(data)
            }
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

        await AuditService.log({
            idTenant,
            idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVALUATION_DELETED',
            entityType: 'evaluation',
            entityId: idEvaluation,
            description: `Avaliação ${idEvaluation} removida`
        })

        return true
    },

    /**
     * Busca os últimos níveis registrados para uma lista de alunos em uma atividade específica.
     * Útil para pré-preencher o formulário de avaliação com o progresso anterior.
     */
    getLatestLevelsForClients: async (idTenant, idBranch, idActivity, clientIds) => {
        if (!clientIds || clientIds.length === 0) return {}

        // Busca todas as avaliações dessa atividade (idealmente filtraríamos mais, mas para performance em turmas pequenas funciona)
        // Uma alternativa mais escalável seria buscar apenas as últimas N avaliações ou usar um índice composto aluno+atividade.
        const evaluations = await evaluationRepository.findWhere(idTenant, idBranch, [
            ['idActivity', '==', idActivity],
            ['deletedAt', '==', null]
        ], { field: 'date', direction: 'desc' })

        const latestLevels = {}
        clientIds.forEach(clientId => {
            const studentEval = evaluations.find(e => e.idStudent === clientId)
            if (studentEval) {
                latestLevels[clientId] = studentEval.idLevel
            }
        })

        return latestLevels
    },

    /**
     * Busca todas as avaliações de um ciclo para uma atividade específica
     */
    getEvaluationsByActivityEvent: async (idTenant, idBranch, idActivity, idEvent) => {
        return await evaluationRepository.findWhere(idTenant, idBranch, [
            ['idActivity', '==', idActivity],
            ['idEvent', '==', idEvent],
            ['deletedAt', '==', null]
        ])
    }
}
