/**
 * Regras de Negócio para Níveis de Avaliação
 */
export const EvaluationLevelRules = {
    /**
     * Valida se um nível pode ser deletado
     */
    validateForDeletion: (level) => {
        if (!level) throw new Error("Nível de avaliação não encontrado")
        if (level.deletedAt) throw new Error("Nível de avaliação já foi excluído")
    },

    /**
     * Prepara os dados de criação de um nível
     */
    buildCreationPayload: (levelData, userId) => {
        return {
            ...levelData,
            isActive: levelData.isActive !== false,
            status: levelData.status || 'active',
            createdBy: userId,
            deletedAt: null
        }
    }
}
