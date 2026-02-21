import { normalizeDate } from '../../../../utils/date'

export const ClientContractSalesClassificationRules = {
    /**
     * Retorna 'new', 'renewal' ou 'winback'
     */
    classify: (lastContractEndDate, newContractStartDate) => {
        const lastEndDate = normalizeDate(lastContractEndDate);
        const newStartDate = normalizeDate(newContractStartDate) || new Date();

        if (!lastEndDate) return 'new';

        // Diferença em dias: Data Início Novo - Data Fim Último
        // Reseta horas para comparação pura de dias
        const d1 = new Date(newStartDate); d1.setHours(12, 0, 0, 0);
        const d2 = new Date(lastEndDate); d2.setHours(12, 0, 0, 0);

        const diffTime = d1.getTime() - d2.getTime();
        const gapDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Regra de Negócio: Gap <= 45 dias é Renovação, > 45 é Retorno (Win-back)
        return gapDays <= 45 ? 'renewal' : 'winback'
    }
}
