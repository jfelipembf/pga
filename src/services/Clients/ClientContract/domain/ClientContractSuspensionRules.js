import moment from 'moment'
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

        let finalStartDate = startDate ? normalizeDate(startDate) : normalizeDate(new Date())
        let finalEndDate = endDate ? normalizeDate(endDate) : null
        let suspensionDays = daysInput

        if (startDate && endDate) {
            suspensionDays = moment(endDate).diff(moment(startDate), 'days')
            finalEndDate = normalizeDate(endDate)
        } else if (suspensionDays) {
            finalEndDate = normalizeDate(moment(finalStartDate).add(suspensionDays, 'days'))
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

        const todayIso = moment().format('YYYY-MM-DD')
        const isFuture = moment(finalStartDate).isAfter(todayIso, 'day')

        return {
            finalStartDate,
            finalEndDate,
            suspensionDays,
            isFuture
        }
    }
}
