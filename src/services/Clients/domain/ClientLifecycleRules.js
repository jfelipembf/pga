import { normalizeDate } from '../../../utils/date'
import { CLIENT_STATUS, LIFECYCLE_STATUS } from '../../../utils/constants'

/**
 * Regras de Negócio para o Ciclo de Vida do Cliente
 */
export const ClientLifecycleRules = {
    /**
     * Valida transições de status
     */
    validateTransition: (currentStatus, newStatus, validTransitions) => {
        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            throw new Error(
                `Transição inválida: ${currentStatus} → ${newStatus}. ` +
                `Transições válidas: ${validTransitions[currentStatus]?.join(', ') || 'nenhuma'}`
            )
        }
    },

    /**
     * Define o estado inicial do cliente na criação.
     * Alunos sempre nascem como LEAD.
     */
    getInitialStatus: (metadata = {}) => {
        return {
            status: CLIENT_STATUS.LEAD,
            lifecycleStatus: LIFECYCLE_STATUS.LEAD,
            lifecycle: {
                createdAt: normalizeDate(new Date()),
                updatedAt: normalizeDate(new Date())
            }
        }
    },

    /**
     * Prepara os campos de atualização baseados no novo status
     */
    prepareStatusUpdates: (client, newStatus, metadata) => {
        const updates = {
            lifecycleStatus: newStatus,
            updatedAt: normalizeDate(new Date())
        }

        // Conversão para Ativo
        if (newStatus === CLIENT_STATUS.ACTIVE && !client.lifecycle?.convertedAt) {
            updates['lifecycle.convertedAt'] = normalizeDate(new Date())
            updates['lifecycle.convertedBy'] = metadata.userId
            if (metadata.contractId) {
                updates['lifecycle.firstContractId'] = metadata.contractId
            }
        }

        // Perdido (Lost)
        if (newStatus === LIFECYCLE_STATUS.LOST) {
            updates['lifecycle.lostAt'] = normalizeDate(new Date())
            updates['lifecycle.lostReason'] = metadata.reason || 'not_specified'
            updates['lifecycle.lostNotes'] = metadata.notes || null
        }

        return updates
    }
}
