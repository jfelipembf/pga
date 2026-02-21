/**
 * Regras de Negócio para Credenciadoras (Acquirers)
 */
export const AcquirerRules = {
    /**
     * Valida se uma credenciadora pode ser deletada
     */
    validateForDeletion: async (idTenant, idBranch, id) => {
        const { receivableRepository } = await import('../../../data/repositories/ReceivableRepository')
        const pending = await receivableRepository.findWhere(idTenant, idBranch, [
            ['idAcquirer', '==', id],
            ['status', '==', 'open']
        ], null, 1)

        if (pending.length > 0) {
            throw new Error("SEGURANÇA: Esta credenciadora possui recebíveis pendentes. Você não pode excluí-la até que todos os títulos sejam liquidados ou transferidos. Sugestão: Apenas desative a credenciadora.")
        }
    }
}
