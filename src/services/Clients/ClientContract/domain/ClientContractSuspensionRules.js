import { normalizeDate } from '../../../../utils/date'

export const ClientContractSuspensionRules = {
    /**
     * Valida as regras de negócio para suspensão e retorna os dados processados para a entidade
     */
    validateAndCalculate: (contract, data) => {
        if (contract.status !== 'active') {
            throw new Error('Apenas contratos ativos podem ser suspensos')
        }

        const { startDate, endDate, suspensionDays: daysInput } = typeof data === 'object' ? data : { suspensionDays: data }

        let finalStartDate = normalizeDate(startDate) || normalizeDate(new Date())
        let finalEndDate = endDate ? normalizeDate(endDate) : null
        let suspensionDays = parseInt(daysInput) || 0

        if (startDate && endDate) {
            const d1 = normalizeDate(startDate);
            const d2 = normalizeDate(endDate);
            const diffTime = d2.getTime() - d1.getTime();
            suspensionDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            finalEndDate = d2;
        } else if (suspensionDays > 0) {
            const dEnd = new Date(finalStartDate);
            dEnd.setDate(dEnd.getDate() + suspensionDays);
            finalEndDate = normalizeDate(dEnd);
        }

        if (!suspensionDays || suspensionDays <= 0) {
            throw new Error('Período de suspensão inválido')
        }

        const rules = contract.rules || {}
        if (rules.allowFreeze === false) {
            throw new Error('Este plano não permite suspensão')
        }

        const totalUsed = contract.suspension?.totalDaysUsed || 0
        const available = (rules.maxFreezeDays || 0) - totalUsed

        if (rules.maxFreezeDays && suspensionDays > available) {
            throw new Error(`Limite de ${available} dias de suspensão (Usado: ${totalUsed}/${rules.maxFreezeDays})`)
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const start = new Date(finalStartDate);
        start.setHours(0, 0, 0, 0);

        const isFuture = start > now;

        return {
            finalStartDate,
            finalEndDate,
            suspensionDays,
            isFuture
        }
    }
}
