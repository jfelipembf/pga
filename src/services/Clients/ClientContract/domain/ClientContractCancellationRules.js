import moment from 'moment'
import { CLIENT_CONTRACT_STATUS } from '../../../../utils/constants'

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
        const todayIso = moment().format('YYYY-MM-DD')
        const finalEffectiveDate = effectiveDate || todayIso
        const isFuture = moment(finalEffectiveDate).isAfter(todayIso, 'day')

        return {
            isFuture,
            effectiveDate: finalEffectiveDate
        }
    },

    /**
     * Filtra quais parcelas (receivables) devem ser canceladas
     */
    filterReceivablesToCancel: (receivableDocs, effectiveDate, cancelFutureReceivables) => {
        if (!cancelFutureReceivables) return []

        const effectiveMoment = moment(effectiveDate)

        return receivableDocs.filter(d => {
            const data = d.data()
            const dueDate = data.dueDate?.seconds
                ? moment(data.dueDate.seconds * 1000)
                : moment(data.dueDate)

            return dueDate.isSameOrAfter(effectiveMoment, 'day')
        })
    }
}
