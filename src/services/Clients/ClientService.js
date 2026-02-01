import { clientRepository } from '../../data/repositories/ClientRepository'
import { AuditService } from '../Audit/AuditService'
import { ClientSchema } from '../../data/schemas/ClientSchema'
import { generateClientId } from '../../utils/sequence'

/**
 * Serviço de Clientes que orquestra Negócio, Persistência e Auditoria.
 */
export const ClientService = {
    /**
     * Cria um novo cliente com validação e auditoria.
     */
    createClient: async (idTenant, idBranch, userId, clientData) => {
        try {
            // 1. Validação (Business Logic)
            await ClientSchema.validate(clientData, { abortEarly: false })

            // 2. Gerar ID Amigável (GYM ID)
            // Formato: 0001, 0002, 0003...
            const friendlyId = await generateClientId(idTenant, idBranch)

            // 3. Persistência (Data Layer)
            const newClient = await clientRepository.create(idTenant, idBranch, {
                ...clientData,
                friendlyId,
                lifecycleStatus: clientData.lifecycleStatus || 'lead' // Status inicial
            })

            // 3. Auditoria (Audit Service)
            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                action: 'CREATE',
                entityType: 'client',
                entityId: newClient.id,
                details: { name: newClient.name, email: newClient.email }
            })

            return newClient
        } catch (error) {
            console.error("Erro no ClientService.createClient:", error)
            throw error // Repassa o erro de validação ou de banco para a UI tratar
        }
    },

    /**
     * Lista todos os clientes do contexto atual.
     */
    listClients: async (idTenant, idBranch) => {
        try {
            const clients = await clientRepository.findAll(idTenant, idBranch)
            return clients
        } catch (error) {
            console.error(`[ClientService] Erro ao listar clientes:`, error)
            throw error
        }
    },

    /**
     * Busca um cliente específico por ID.
     */
    getClientById: async (idTenant, idBranch, id) => {
        return await clientRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Deleta um cliente com auditoria.
     */
    deleteClient: async (idTenant, idBranch, userId, id) => {
        // Busca antes para salvar o estado no log
        const client = await clientRepository.findById(idTenant, idBranch, id)

        await clientRepository.delete(idTenant, idBranch, id)

        await AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'DELETE',
            entityType: 'client',
            entityId: id,
            details: { before: client }
        })

        return id
    },

    /**
     * ÚNICA função autorizada a mudar o lifecycleStatus do cliente.
     * Valida transições e registra auditoria.
     */
    updateLifecycleStatus: async (idTenant, idBranch, idClient, newStatus, metadata = {}) => {
        const { VALID_TRANSITIONS } = await import('../../data/schemas/ClientSchema')

        // 1. Busca cliente atual
        const client = await clientRepository.findById(idTenant, idBranch, idClient)
        const currentStatus = client.lifecycleStatus || 'lead'

        // 2. Valida transição
        if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
            throw new Error(
                `Transição inválida: ${currentStatus} → ${newStatus}. ` +
                `Transições válidas: ${VALID_TRANSITIONS[currentStatus]?.join(', ') || 'nenhuma'}`
            )
        }

        // 3. Prepara atualização
        const updates = {
            lifecycleStatus: newStatus,
            updatedAt: new Date()
        }

        // 4. Campos específicos por status
        if (newStatus === 'active' && !client.lifecycle?.convertedAt) {
            updates['lifecycle.convertedAt'] = new Date()
            updates['lifecycle.convertedBy'] = metadata.userId
            if (metadata.contractId) {
                updates['lifecycle.firstContractId'] = metadata.contractId
            }
        }

        if (newStatus === 'lost') {
            updates['lifecycle.lostAt'] = new Date()
            updates['lifecycle.lostReason'] = metadata.reason || 'not_specified'
            updates['lifecycle.lostNotes'] = metadata.notes || null
        }

        // 5. Atualiza cliente
        await clientRepository.update(idTenant, idBranch, idClient, updates)

        // 6. Registra auditoria
        await AuditService.log({
            idTenant,
            idBranch,
            userId: metadata.userId,
            action: 'UPDATE_LIFECYCLE_STATUS',
            entityType: 'client',
            entityId: idClient,
            details: {
                from: currentStatus,
                to: newStatus,
                reason: metadata.reason,
                ...metadata
            }
        })

        return { from: currentStatus, to: newStatus }
    }
}
