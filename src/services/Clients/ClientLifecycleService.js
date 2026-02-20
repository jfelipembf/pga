import { clientRepository } from '../../data/repositories/ClientRepository'
import { LIFECYCLE_STATUS } from '../../utils/constants'

// Domain Rules
import { ClientLifecycleRules } from './domain/ClientLifecycleRules'

// Audit Logger
import { ClientAuditLogger } from './audit/ClientAuditLogger'

/**
 * Serviço dedicado ao Funil de Vendas do Cliente.
 * Gerencia exclusivamente as transições de lifecycle (Lead → Converted).
 * 
 * Após a conversão (compra do primeiro contrato), o aluno SAI do funil.
 * Mudanças de status operacional (active, suspended, inactive) são
 * responsabilidade do ClientContractService/Cloud Functions.
 * 
 * Responsabilidades:
 * - Transições de lifecycle: Lead → Scheduled → Attended → Converted
 * - Validação de transições permitidas
 * - Auditoria de mudanças de funil
 */
export const ClientLifecycleService = {

    /**
     * ÚNICA função autorizada a mudar o lifecycleStatus do cliente.
     * Valida transições e registra auditoria.
     */
    updateStatus: async (idTenant, idBranch, idClient, newStatus, metadata = {}) => {
        const { VALID_TRANSITIONS } = await import('../../data/schemas/Clients/ClientSchema')

        // 1. Busca cliente atual
        const client = await clientRepository.findById(idTenant, idBranch, idClient)
        const currentStatus = client.lifecycleStatus || LIFECYCLE_STATUS.LEAD

        // 2. Valida transição (Domain Layer)
        ClientLifecycleRules.validateTransition(currentStatus, newStatus, VALID_TRANSITIONS)

        // 3. Prepara atualização baseada nas regras (Domain Layer)
        const updates = ClientLifecycleRules.prepareStatusUpdates(client, newStatus, metadata)

        // 4. Atualiza cliente
        await clientRepository.update(idTenant, idBranch, idClient, updates)

        // 5. Registra auditoria
        await ClientAuditLogger.logLifecycleStatusUpdate({
            idTenant, idBranch,
            userId: metadata.userId,
            userName: metadata.userName,
            userPhoto: metadata.userPhoto,
            idClient,
            from: currentStatus,
            to: newStatus,
            reason: metadata.reason,
            metadata
        })

        // 6. Sincroniza campos computados (import dinâmico para evitar circular)
        const { ClientService } = await import('./ClientService')
        await ClientService.syncComputedFields(idTenant, idBranch, idClient)

        return { from: currentStatus, to: newStatus }
    }
}
