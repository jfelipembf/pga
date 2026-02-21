/**
 * Regras de Negócio para Áreas/Espaços
 */
export const AreaRules = {
    /**
     * Valida se uma área pode ser deletada
     */
    validateForDeletion: (area) => {
        if (!area || !area.id) throw new Error("Área não encontrada")
        if (area.deletedAt) throw new Error("Área já foi excluída")
    }
}
