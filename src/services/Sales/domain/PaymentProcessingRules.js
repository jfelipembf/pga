import { normalizeDate } from '../../../utils/date';

/**
 * Regras de Negócio para Processamento de Pagamentos
 * Isola a lógica de seleção de taxas e cálculo de vencimentos.
 */
export const PaymentProcessingRules = {

    /**
     * Identifica a adquirente ativa correta para um pagamento.
     */
    resolveAcquirer: (acquirers = [], payment) => {
        return acquirers.find(a =>
            a.id === payment.idAcquirer ||
            a.id === payment.provider ||
            a.name === payment.provider
        );
    },

    /**
     * Resolve a taxa total (MDR + Antecipação) baseada na adquirente, bandeira e parcelas.
     */
    resolveFeePercentage: (acquirer, payment, numInstallments) => {
        if (!acquirer || !acquirer.fees) return 0;

        let targetFees = acquirer.fees;

        // Tenta achar configuração específica da Bandeira
        if (acquirer.rateConfigs && Array.isArray(acquirer.rateConfigs)) {
            const brandConfig = acquirer.rateConfigs.find(c => c.brands && c.brands.includes(payment.brand));
            if (brandConfig && brandConfig.fees) {
                targetFees = brandConfig.fees;
            }
        }

        if (payment.methodId === 'debit_card') {
            return parseFloat(targetFees.debitCard) || 0;
        }

        const instKey = `creditCard${numInstallments}x`;
        return parseFloat(targetFees[instKey]) || 0;
    },

    /**
     * Resolve a taxa base (MDR padrão) para separação do custo financeiro.
     */
    resolveBaseFeePercentage: (acquirer, payment, numInstallments, totalFee) => {
        if (!acquirer || !acquirer.standardFees) return totalFee;

        if (payment.methodId === 'debit_card') {
            return parseFloat(acquirer.standardFees.debitCard) || 0;
        }

        const instKey = `creditCard${numInstallments}x`;
        let standardFee = acquirer.standardFees[instKey];

        // Fallback para Grupos Simplificados (bucket)
        if (standardFee === undefined || standardFee === null || standardFee === 0) {
            if (numInstallments >= 2 && numInstallments <= 6) {
                standardFee = acquirer.standardFees['creditCard2x'];
            } else if (numInstallments >= 7 && numInstallments <= 12) {
                standardFee = acquirer.standardFees['creditCard7x'];
            }
        }

        const base = parseFloat(standardFee);
        return (!isNaN(base) && base > 0) ? base : totalFee;
    },

    /**
     * Calcula a data de vencimento de uma parcela.
     */
    calculateDueDate: (saleDate, installmentNumber, methodId, acquirer) => {
        const settlementDays = acquirer?.settlementDays || 30;
        const isAnticipated = settlementDays === 1;

        const daysToAdd = methodId === 'debit_card'
            ? 1  // Débito = D+1
            : (isAnticipated ? 1 : (settlementDays * installmentNumber));

        const d = new Date(saleDate);
        d.setDate(d.getDate() + daysToAdd);
        return normalizeDate(d);
    }
};
