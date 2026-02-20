import moment from 'moment'
import { normalizeDate } from '../../../../utils/date'
import { CLIENT_CONTRACT_STATUS } from '../../../../utils/constants'

/**
 * Regras de Negócio para Ajuste de Vigência de Contratos
 */
export const ClientContractAdjustmentRules = {

    /**
     * Valida se o contrato pode sofrer ajuste e calcula a nova data
     */
    calculateNewEndDate: (contract, days, mode) => {
        // 1. Validação de Status
        if (![CLIENT_CONTRACT_STATUS.ACTIVE, CLIENT_CONTRACT_STATUS.SUSPENDED].includes(contract.status)) {
            throw new Error('Apenas contratos ativos ou suspensos podem ter a vigência ajustada')
        }

        // 2. Cálculo da nova data
        const currentEndDate = contract.endDate?.toDate ? contract.endDate.toDate() : new Date(contract.endDate)

        const newEndDate = normalizeDate(
            mode === 'add'
                ? moment(currentEndDate).add(days, 'days')
                : moment(currentEndDate).subtract(days, 'days')
        )

        return {
            oldEndDate: currentEndDate,
            newEndDate
        }
    }
}
