/**
 * Regras de Negócio para Colaboradores (Staff)
 */
export const StaffRules = {
    /**
     * Valida se um colaborador pode ser deletado
     */
    validateForDeletion: (staff) => {
        if (!staff) throw new Error("Colaborador não encontrado")
    },

    /**
     * Prepara os dados para persitência no Firestore (sem password)
     */
    buildCreationPayload: (staffData, userId) => {
        const { password, confirmPassword, ...dbData } = staffData

        return {
            ...dbData,
            isActive: dbData.isActive !== false,
            status: dbData.status || 'active',
            createdBy: userId,
            deletedAt: null
        }
    }
}
