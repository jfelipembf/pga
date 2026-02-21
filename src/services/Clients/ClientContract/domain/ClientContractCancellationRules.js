import { CLIENT_CONTRACT_STATUS } from '../../../../utils/constants'
import { normalizeDate } from '../../../../utils/date'

/**
 * Regras de Negócio para Cancelamento de Contratos
 */
export const ClientContractCancellationRules = {

    /**
     * Valida se o contrato pode ser cancelado
     */
    validate: (contract) => {
        if (contract.status === CLIENT_CONTRACT_STATUS.CANCELLED) {
            throw new Error('Contrato já está cancelado')
        }
    },

    /**
     * Define se o cancelamento é imediato ou agendado baseado na data efetiva
     */
    getExecutionType: (effectiveDate) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const effDate = normalizeDate(effectiveDate) || new Date();
        const effDateClean = new Date(effDate);
        effDateClean.setHours(0, 0, 0, 0);

        const isFuture = effDateClean > now;

        return {
            isFuture,
            effectiveDate: effDate
        }
    },

    /**
     * Filtra quais parcelas (receivables) devem ser canceladas
     */
    filterReceivablesToCancel: (receivableDocs, effectiveDate, cancelFutureReceivables) => {
        if (!cancelFutureReceivables) return []

        const effDate = normalizeDate(effectiveDate);
        if (!effDate) return [];

        const effTime = new Date(effDate);
        effTime.setHours(0, 0, 0, 0);

        return receivableDocs.filter(d => {
            const data = d.data()
            const dueDate = normalizeDate(data.dueDate);
            if (!dueDate) return false;

            const dueTime = new Date(dueDate);
            dueTime.setHours(0, 0, 0, 0);

            return dueTime >= effTime;
        })
    },

    /**
     * Calcula o reembolso proporcional de um contrato com multa
     */
    calculateRefund: (totalPaid, totalDuration, usedDuration, cancelFeePercent) => {
        if (usedDuration >= totalDuration) return { refundAmount: 0, feeAmount: 0 }

        // Valor por Unidade de Tempo
        const valuePerUnit = totalPaid / totalDuration
        // Valor Consumido
        const consumedValue = valuePerUnit * usedDuration
        // Saldo Restante (Base de Cálculo)
        const remainingBalance = totalPaid - consumedValue
        // Multa
        const feeAmount = remainingBalance * (cancelFeePercent / 100)
        // Valor a Devolver
        const refundAmount = remainingBalance - feeAmount

        return {
            totalPaid,
            consumedValue,
            remainingBalance,
            feeAmount,
            refundAmount: refundAmount > 0 ? refundAmount : 0
        }
    }
}
