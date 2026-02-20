import moment from 'moment'

export const ClientContractSalesClassificationRules = {
    /**
     * Retorna 'new', 'renewal' ou 'winback'
     */
    classify: (lastContractEndDate, newContractStartDate) => {
        if (!lastContractEndDate) return 'new'

        const lastEndDate = lastContractEndDate?.toDate ? lastContractEndDate.toDate() : new Date(lastContractEndDate)
        const newStartDate = newContractStartDate || new Date()

        // Diferença em dias: Data Início Novo - Data Fim Último
        const gapDays = moment(newStartDate).startOf('day').diff(moment(lastEndDate).startOf('day'), 'days')

        // Regra de Negócio: Gap <= 45 dias é Renovação, > 45 é Retorno (Win-back)
        return gapDays <= 45 ? 'renewal' : 'winback'
    }
}
