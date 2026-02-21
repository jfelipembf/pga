import { EvaluationSchema } from '../../../data/schemas/Evaluations/EvaluationSchema'
import { normalizeDate } from '../../../utils/date'

/**
 * Regras de Domínio para Avaliações
 */
export const EvaluationRules = {
    /**
     * Valida os dados de entrada usando Yup (EvaluationSchema)
     * e garante as regras de negócio intrínsecas ao ciclo e eventos.
     */
    validateForRegistration: async (data) => {
        // 1. Validar se há um evento ativo para avaliação
        if (!data.idEvent) {
            throw new Error("Não é possível registrar avaliações fora de um período (ciclo) ativo.")
        }

        // 2. Validar entrada (limpa campos desconhecidos)
        return await EvaluationSchema.validate(data, { abortEarly: false, stripUnknown: true })
    },

    /**
     * @param {object} validData 
     * @param {object} user 
     * @returns Payload pronto para criar uma nova avaliação
     */
    buildCreationPayload: (validData, user) => {
        return {
            ...validData,
            createdBy: user.uid,
            createdByName: user.displayName || user.email,
        }
    },

    /**
     * @param {object} validData 
     * @param {object} user 
     * @returns Payload pronto para atualizar uma avaliação existente (do mesmo ciclo)
     */
    buildUpdatePayload: (validData, user) => {
        return {
            ...validData,
            updatedBy: user.uid,
            updatedByName: user.displayName || user.email,
            updatedAt: normalizeDate(new Date())
        }
    },

    /**
     * Construção simples do payload para atualizações diretas
     */
    buildDirectUpdatePayload: (data, user) => {
        return {
            ...data,
            updatedBy: user.uid,
            updatedByName: user.displayName || user.email,
            updatedAt: new Date()
        }
    }
}
