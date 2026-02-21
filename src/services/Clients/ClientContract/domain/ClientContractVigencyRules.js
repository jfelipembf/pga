import { normalizeDate } from '../../../../utils/date'

/**
 * Regras de Negócio para Vigência e Datas de Contratos de Clientes.
 */
export const ClientContractVigencyRules = {
    /**
     * Calcula a data final e o tipo de plano com base na duração.
     */
    calculatePeriod: (startDate, duration, durationType) => {
        const d = normalizeDate(startDate) || new Date()
        const endDate = new Date(d)
        const dur = parseInt(duration) || 0
        let planType = 'monthly'

        if (durationType === 'days' || durationType === 'Dias') {
            endDate.setDate(endDate.getDate() + dur)
            planType = 'single'
        } else if (durationType === 'weeks' || durationType === 'Semanas') {
            endDate.setDate(endDate.getDate() + (dur * 7))
        } else if (durationType === 'years' || durationType === 'Anos') {
            endDate.setFullYear(endDate.getFullYear() + dur)
            planType = 'annual'
        } else {
            // Default to months
            endDate.setMonth(endDate.getMonth() + dur)
            if (dur === 1) planType = 'monthly'
            else if (dur === 3) planType = 'quarterly'
            else if (dur === 6) planType = 'semiannual'
            else if (dur === 12) planType = 'annual'
        }

        return { endDate, planType }
    },

    /**
     * Define o status de vigência (active, expired, etc) do contrato.
     */
    resolveStatus: (contract) => {
        if (!contract) return 'unknown'
        if (contract.status === 'cancelled') return 'cancelled'
        if (contract.status === 'suspended') return 'suspended'

        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const endDate = normalizeDate(contract.endDate)

        if (!endDate) return 'unknown'
        endDate.setHours(0, 0, 0, 0)

        if (endDate < now) return 'expired'

        return 'active'
    }
}
