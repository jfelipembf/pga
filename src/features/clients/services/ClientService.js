import { clientRepository } from '../repositories/ClientRepository'
import { AuditService } from '../../../services/Audit/AuditService'
import { ClientSchema } from '../schemas/ClientSchema'
import { generateClientId } from '../../../utils/sequence'
import { normalizeDate } from '../../../utils/date'

/**
 * Serviço de Clientes que orquestra Negócio, Persistência e Auditoria.
 */
export const ClientService = {
    /**
     * Cria um novo cliente com validação e auditoria.
     */
    createClient: async (idTenant, idBranch, userId, rawData) => {
        try {
            // 1. Sanitização e Preparação Automática
            const sanitize = (val) => val === undefined ? null : val

            // Unifica nome e garante estrutura aninhada se não vier do form
            const firstName = sanitize(rawData.firstName)
            const lastName = sanitize(rawData.lastName)
            const name = rawData.name || `${firstName || ''} ${lastName || ''}`.trim()

            const clientData = {
                ...rawData,
                firstName,
                lastName,
                name,
                photoUrl: rawData.photoUrl || null,
                cpf: sanitize(rawData.cpf),
                gender: sanitize(rawData.gender) || 'unspecified',
                // Garante objetos aninhados se vierem flat do formulário
                address: rawData.address || {
                    zipCode: sanitize(rawData.zipCode),
                    street: sanitize(rawData.street),
                    number: sanitize(rawData.number),
                    complement: sanitize(rawData.complement),
                    neighborhood: sanitize(rawData.neighborhood),
                    city: sanitize(rawData.city),
                    state: sanitize(rawData.state)
                },
                emergencyContact: rawData.emergencyContact || {
                    name: sanitize(rawData.emergencyName),
                    phone: sanitize(rawData.emergencyPhone),
                    email: sanitize(rawData.emergencyEmail)
                },
                healthObservations: sanitize(rawData.healthObservations) || null
            }

            // 2. Validação (Business Logic)
            await ClientSchema.validate(clientData, { abortEarly: false })

            // 3. Gerar ID Amigável (GYM ID)
            const friendlyId = await generateClientId(idTenant, idBranch)

            // 4. Persistência (Data Layer)
            const newClient = await clientRepository.create(idTenant, idBranch, {
                ...clientData,
                friendlyId,
                lifecycleStatus: clientData.lifecycleStatus || 'lead'
            })

            // 3. Auditoria (Audit Service)
            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName: clientData.userName,
                action: 'CREATE',
                entityType: 'client',
                entityId: newClient.id,
                description: `Cliente criado: ${newClient.name}`,
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
            const clients = await clientRepository.findActive(idTenant, idBranch)
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
     * Atualiza dados do cliente com auditoria.
     */
    updateClient: async (idTenant, idBranch, userId, idClient, rawData) => {
        try {
            // 1. Busca estado anterior para comparação na auditoria
            const oldData = await clientRepository.findById(idTenant, idBranch, idClient)
            if (!oldData) throw new Error("Cliente não encontrado")

            const sanitize = (val) => val === undefined ? null : val

            // 2. Preparação do dado
            const firstName = sanitize(rawData.firstName)
            const lastName = sanitize(rawData.lastName)
            const name = rawData.name || `${firstName || ''} ${lastName || ''}`.trim()

            const clientData = {
                ...rawData,
                firstName,
                lastName,
                name,
                address: rawData.address || {
                    zipCode: sanitize(rawData.zipCode),
                    street: sanitize(rawData.street),
                    number: sanitize(rawData.number),
                    complement: sanitize(rawData.complement),
                    neighborhood: sanitize(rawData.neighborhood),
                    city: sanitize(rawData.city),
                    state: sanitize(rawData.state)
                },
                emergencyContact: rawData.emergencyContact || {
                    name: sanitize(rawData.emergencyName),
                    phone: sanitize(rawData.emergencyPhone),
                    email: sanitize(rawData.emergencyEmail)
                },
                healthObservations: sanitize(rawData.healthObservations) || null
            }

            // 3. Validação
            await ClientSchema.validate(clientData, { abortEarly: false })

            // 4. Persistência
            await clientRepository.update(idTenant, idBranch, idClient, clientData)

            // 5. Auditoria
            const changedFields = {}
            Object.keys(clientData).forEach(key => {
                if (JSON.stringify(clientData[key]) !== JSON.stringify(oldData[key])) {
                    changedFields[key] = { from: oldData[key], to: clientData[key] }
                }
            })

            await AuditService.log({
                idTenant, idBranch, userId,
                userName: rawData.userName,
                action: 'UPDATE',
                entityType: 'client',
                entityId: idClient,
                description: `Perfil do cliente atualizado: ${clientData.name}`,
                details: changedFields
            })

            return { id: idClient, ...clientData }
        } catch (error) {
            console.error("Erro no ClientService.updateClient:", error)
            throw error
        }
    },

    /**
     * Deleta um cliente com auditoria.
     */
    /**
     * Deleta um cliente com verificação de segurança e auditoria (Soft Delete).
     * O sistema impede exclusão se houver contratos ativos ou dívidas.
     */
    deleteClient: async (idTenant, idBranch, userId, id, userName = null) => {
        // 1. Busca estado atual
        const client = await clientRepository.findById(idTenant, idBranch, id)
        if (!client) throw new Error("Cliente não encontrado.")

        // 2. CHECK: Contratos Ativos
        // Importa repositório aqui para evitar dependência circular se possível, ou usa injeção
        const { clientContractRepository } = await import('../repositories/ClientContractRepository')
        const activeContracts = await clientContractRepository.findByClient(idTenant, idBranch, id)
        const hasActiveContracts = activeContracts.some(c => c.status === 'active' || c.status === 'suspended')

        if (hasActiveContracts) {
            throw new Error("SEGURANÇA: Não é possível excluir cliente com contratos Ativos ou Suspensos. Cancele os contratos primeiro.")
        }

        // 3. CHECK: Financeiro em Aberto
        const { receivableRepository } = await import('../../../data/repositories/ReceivableRepository')
        const openReceivables = await receivableRepository.findWhere(idTenant, idBranch, [
            ['idClient', '==', id],
            ['status', '==', 'open'],
            ['deletedAt', '==', null]
        ])

        if (openReceivables.length > 0) {
            throw new Error(`SEGURANÇA: Cliente possui ${openReceivables.length} títulos financeiros em aberto. Baixe ou cancele os títulos antes.`)
        }

        // 4. Se passou, executa Soft Delete
        await clientRepository.softDelete(idTenant, idBranch, id, userId)

        // 5. Auditoria da Exclusão
        await AuditService.log({
            idTenant,
            idBranch,
            userId,
            userName,
            action: 'DELETE',
            entityType: 'client',
            entityId: id,
            description: `Cliente excluído: ${client.name}`,
            details: {
                name: client.name,
                reason: 'User request',
                method: 'soft_delete'
            }
        })

        return id
    },

    /**
     * ÚNICA função autorizada a mudar o lifecycleStatus do cliente.
     * Valida transições e registra auditoria.
     */
    updateLifecycleStatus: async (idTenant, idBranch, idClient, newStatus, metadata = {}) => {
        const { VALID_TRANSITIONS } = await import('../schemas/ClientSchema')

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
            updatedAt: normalizeDate(new Date())
        }

        // 4. Campos específicos por status
        if (newStatus === 'active' && !client.lifecycle?.convertedAt) {
            updates['lifecycle.convertedAt'] = normalizeDate(new Date())
            updates['lifecycle.convertedBy'] = metadata.userId
            if (metadata.contractId) {
                updates['lifecycle.firstContractId'] = metadata.contractId
            }
        }

        if (newStatus === 'lost') {
            updates['lifecycle.lostAt'] = normalizeDate(new Date())
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
    },

    /**
     * Define o status operacional real do cliente (Fonte Única de Verdade).
     * Cruza o lifecycleStatus com a validade dos contratos.
     */
    calculateLiveStatus: (client, contracts = []) => {
        if (!client) return null;

        // 1. Se o aluno foi marcado como 'Perdido', esse é o status final
        if (client.lifecycleStatus === 'lost') return 'lost';

        // 2. Se houver contratos, o status depende da vigência deles
        if (contracts && contracts.length > 0) {
            const now = new Date();

            // Verificar se há algum contrato ATIVO hoje
            const hasActive = contracts.some(c => {
                const isStatusActive = c.status === 'active';
                const endDate = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate);
                return isStatusActive && (endDate >= now);
            });

            if (hasActive) return 'active';

            // Verificar se há algum contrato SUSPENSO
            const hasSuspended = contracts.some(c => c.status === 'suspended');
            if (hasSuspended) return 'suspended';

            // Se todos os contratos expiraram ou foram cancelados
            return 'inactive';
        }

        // 3. Se não tem contratos, mantém o status de funil (lead, scheduled, attended)
        return client.lifecycleStatus || 'lead';
    }
}
