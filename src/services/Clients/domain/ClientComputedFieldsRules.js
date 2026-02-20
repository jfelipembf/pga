import { normalizeDate } from '../../../utils/date'
import { ClientHelper } from '../helpers/ClientHelper'

/**
 * Regras de Negócio para Campos Computados (Denormalização)
 */
export const ClientComputedFieldsRules = {
    /**
     * Define como o objeto 'computed' é montado
     */
    buildComputedObject: (client, contracts, enrollments) => {
        // 1. Ordenação de contratos por data de término (Mais recente primeiro)
        const sortedContracts = [...contracts].sort((a, b) => {
            const dateA = a.endDate?.toDate ? a.endDate.toDate() : new Date(a.endDate || 0)
            const dateB = b.endDate?.toDate ? b.endDate.toDate() : new Date(b.endDate || 0)
            return dateB - dateA
        })

        // 2. Filtro de contratos ativos
        const activeContracts = sortedContracts.filter(c =>
            c.status === 'active' || c.status === 'scheduled_cancellation'
        )

        // 3. Matrículas Ativas (Activities & Instructors)
        const activeActivities = [...new Set(enrollments.map(e => e.activityName).filter(Boolean))]
        const activeInstructors = [...new Set(enrollments.map(e => e.instructorName).filter(Boolean))]

        // 4. Múltiplos Contratos Ativos info
        const activeContractsInfo = activeContracts.map(c => ({
            idClientContract: c.id,
            idContract: c.idContract || null,
            planName: c.planName || null,
            planType: c.planType || null,
            value: c.value || null,
            endDate: c.endDate || null
        }))

        // 5. Montar Objeto Final
        return {
            activeContracts: activeContractsInfo,
            activeActivities,
            activeInstructors,
            searchText: ClientHelper.generateSearchText(client),
            updatedAt: normalizeDate(new Date())
        }
    }
}
