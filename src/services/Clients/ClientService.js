import { clientRepository } from '../../data/repositories/ClientRepository'
import { AuditService } from '../Audit/AuditService'
import { ClientSchema } from '../../data/schemas/ClientSchema'
import { generateFriendlyId } from '../../utils/sequence'

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

            // 2. Gerar ID Amigável
            // Formato solicitado: 0001 (sem prefixo CLI)
            const friendlyId = await generateFriendlyId(idTenant, idBranch, 'clients', { prefix: '', padding: 4 })

            // 3. Persistência (Data Layer)
            const newClient = await clientRepository.create(idTenant, idBranch, {
                ...clientData,
                friendlyId
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
    }
}
