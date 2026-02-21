/**
 * Regras de Negócio para Atividades
 */
export const ActivityRules = {
    /**
     * Valida se uma atividade pode ser deletada
     */
    validateForDeletion: (activity) => {
        if (!activity) throw new Error("Atividade não encontrada")
        if (activity.deletedAt) throw new Error("Atividade já foi excluída")
    },

    /**
     * Prepara os dados de criação de uma atividade
     */
    buildCreationPayload: (activityData, userId, photoUrl) => {
        const { photoFile, ...dataToSave } = activityData

        return {
            ...dataToSave,
            photo: photoUrl,
            photoUrl: photoUrl,
            isActive: activityData.isActive !== false,
            status: activityData.status || 'active',
            createdBy: userId,
            deletedAt: null
        }
    },

    /**
     * Prepara os dados de atualização de uma atividade
     */
    buildUpdatePayload: (data, photoUrl) => {
        const { photoFile, ...dataToSave } = data

        return {
            ...dataToSave,
            photo: photoUrl,
            photoUrl: photoUrl
        }
    }
}
