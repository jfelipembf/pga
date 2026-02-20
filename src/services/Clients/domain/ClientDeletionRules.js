/**
 * Regras de Negócio para Exclusão de Clientes
 */
export const ClientDeletionRules = {
    /**
     * Valida se o cliente pode ser excluído baseado em contratos e financeiro
     */
    validate: (client, activeContractsCount, openReceivablesCount) => {
        if (!client) {
            throw new Error("Cliente não encontrado.")
        }

        if (activeContractsCount > 0) {
            throw new Error("SEGURANÇA: Não é possível excluir cliente com contratos Ativos ou Suspensos. Cancele os contratos primeiro.")
        }

        if (openReceivablesCount > 0) {
            throw new Error(`SEGURANÇA: Cliente possui ${openReceivablesCount} títulos financeiros em aberto. Baixe ou cancele os títulos antes.`)
        }
    }
}
