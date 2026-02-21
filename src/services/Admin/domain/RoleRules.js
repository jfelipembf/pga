/**
 * Regras de Negócio para Cargos/Funções (Roles)
 */
export const RoleRules = {
    /**
     * Valida se um cargo pode ser deletado
     */
    validateForDeletion: (role) => {
        if (!role) throw new Error("Função não encontrada")
        if (role.deletedAt) throw new Error("Função já foi excluída")
    },

    /**
     * Prepara os dados de criação de um cargo
     */
    buildCreationPayload: (roleData, userId) => {
        return {
            ...roleData,
            status: roleData.status || 'active',
            permissions: roleData.permissions || {},
            createdBy: userId,
            deletedAt: null
        }
    }
}
