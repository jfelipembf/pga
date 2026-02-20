import { clientRepository } from '../../data/repositories/ClientRepository'
import { AuditService } from '../Core/AuditService'
import { ClientSchema } from '../../data/schemas/Clients/ClientSchema'
import { generateClientId } from '../../utils/sequence'
import { normalizeDate } from '../../utils/date'
import { ClientHelper } from './helpers/ClientHelper'

/**
 * Serviço de Clientes que orquestra Negócio, Persistência e Auditoria.
 */
export const ClientService = {
    /**
     * Cria um novo cliente com validação e auditoria.
     */
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
     * Busca clientes por termo (nome, email, cpf, telefone).
     */
    searchClients: async (idTenant, idBranch, term) => {
        if (!term || term.length < 2) return []

        const lowerTerm = term.toLowerCase().trim()

        // 1. Tentar busca otimizada via Firestore (pelo menos prefixo do nome ou ID Amigável se possível)
        // Por enquanto, mantemos a busca em memória mas usando o searchText denormalizado
        const all = await clientRepository.findActive(idTenant, idBranch)

        const results = all.filter(c => {
            const computed = c.computed || {}
            // Se tiver o campo de busca pronto, usa ele (Muito mais rápido)
            if (computed.searchText) {
                return computed.searchText.includes(lowerTerm)
            }

            // Fallback para clientes antigos não sincronizados
            return (
                (c.name && c.name.toLowerCase().includes(lowerTerm)) ||
                (c.email && c.email.toLowerCase().includes(lowerTerm)) ||
                (c.cpf && c.cpf.includes(term)) ||
                (c.phone && c.phone.includes(term)) ||
                (c.friendlyId && String(c.friendlyId).toLowerCase().includes(lowerTerm))
            )
        }).slice(0, 15)

        return results
    },

    createClient: async (idTenant, idBranch, userId, rawData) => {
        try {
            // 1. Preparação Otimizada via Helper
            const clientData = ClientHelper.prepareForSave(rawData)

            // 2. Validação (Business Logic)
            await ClientSchema.validate(clientData, { abortEarly: false })

            // 3. Gerar ID Amigável (GYM ID)
            const friendlyId = await generateClientId(idTenant, idBranch)

            // 4. Persistência (Data Layer)
            const newClient = await clientRepository.create(idTenant, idBranch, {
                ...clientData,
                friendlyId,
                lifecycleStatus: clientData.lifecycleStatus || 'lead',
                computed: {
                    activeContractId: null,
                    activePlanName: 'Sem Plano',
                    contractEndDate: null,
                    monthlyValue: 0,
                    activeActivities: [],
                    activeInstructors: [],
                    searchText: ClientHelper.generateSearchText({ ...clientData, friendlyId }),
                    updatedAt: normalizeDate(new Date())
                }
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

            // 2. Preparação Otimizada via Helper
            const clientData = ClientHelper.prepareForSave(rawData)

            // 3. Validação
            await ClientSchema.validate(clientData, { abortEarly: false })

            // 4. Persistência
            await clientRepository.update(idTenant, idBranch, idClient, clientData)

            // 5. Auditoria Centralizada com Diff
            await AuditService.logUpdate({
                idTenant,
                idBranch,
                userId,
                userName: rawData.userName,
                entityType: 'client',
                entityId: idClient,
                oldData,
                newData: clientData,
                description: `Atualizou o perfil do cliente ${oldData.name}`
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
        const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository')
        const activeContracts = await clientContractRepository.findByClient(idTenant, idBranch, id)
        const hasActiveContracts = activeContracts.some(c => c.status === 'active' || c.status === 'suspended')

        if (hasActiveContracts) {
            throw new Error("SEGURANÇA: Não é possível excluir cliente com contratos Ativos ou Suspensos. Cancele os contratos primeiro.")
        }

        // 3. CHECK: Financeiro em Aberto
        const { receivableRepository } = await import('../../data/repositories/ReceivableRepository')
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
                snapshot: client,
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
        const { VALID_TRANSITIONS } = await import('../../data/schemas/Clients/ClientSchema')

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

        // 4. Sincroniza campos computados (denormalização)
        await ClientService.syncComputedFields(idTenant, idBranch, idClient)

        return { from: currentStatus, to: newStatus }
    },

    /**
     * Sincroniza os campos computados (denormalização) do cliente.
     * Deve ser chamado sempre que houver alteração em contratos ou matrículas.
     */
    syncComputedFields: async (idTenant, idBranch, idClient) => {
        try {
            const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository')
            const { enrollmentRepository } = await import('../../data/repositories/EnrollmentRepository')

            // 1. Buscar Aluno
            const client = await clientRepository.findById(idTenant, idBranch, idClient)
            if (!client) return

            // 2. Buscar Contrato Ativo (Pega o mais recente com status active)
            const contracts = await clientContractRepository.findByClient(idTenant, idBranch, idClient)
            const activeContract = contracts
                .filter(c => c.status === 'active' || c.status === 'scheduled_cancellation')
                .sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
                    return dateB - dateA
                })[0] || null

            // 3. Buscar Matrículas Ativas
            const enrollments = await enrollmentRepository.findActiveByClient(idTenant, idBranch, idClient)
            const activeActivities = [...new Set(enrollments.map(e => e.activityName).filter(Boolean))]
            const activeInstructors = [...new Set(enrollments.map(e => e.instructorName).filter(Boolean))]

            // 4. Montar Objeto Computed
            const computed = {
                activeContractId: activeContract ? (activeContract.id || activeContract.friendlyId) : null,
                activePlanName: activeContract?.planName || 'Sem Plano',
                idPlan: activeContract?.idPlan || null,
                planType: activeContract?.planType || null,
                contractEndDate: activeContract?.endDate || null,
                monthlyValue: activeContract?.value || 0,
                activeActivities: activeActivities,
                activeInstructors: activeInstructors,
                searchText: ClientHelper.generateSearchText(client),
                updatedAt: normalizeDate(new Date())
            }

            // 5. Atualizar Cliente
            await clientRepository.update(idTenant, idBranch, idClient, { computed })

            console.log(`✅ [ClientService] Campos computados sincronizados para: ${client.name}`)
        } catch (error) {
            console.error(`❌ [ClientService] Erro ao sincronizar campos computados do cliente ${idClient}:`, error)
        }
    },

    /**
     * Define o status operacional real do cliente (Fonte Única de Verdade).
     * Cruza o lifecycleStatus com a validade dos contratos.
     */
    calculateLiveStatus: (client, contracts = []) => {
        if (!client) return null

        // 1. Se o aluno foi marcado como 'Perdido', esse é o status final
        if (client.lifecycleStatus === 'lost') return 'lost'

        // 2. Tenta usar campos computados (mais rápido se já estiverem presentes)
        const computed = client.computed || {}
        if (contracts.length === 0 && computed.activeContractId) {
            // Se temos um contrato ativo denormalizado, mas ele pode ter expirado agora
            const endDate = computed.contractEndDate ? new Date(computed.contractEndDate) : null
            if (endDate && endDate < new Date()) {
                return 'inactive' // Expirou
            }
            return 'active'
        }

        // 3. Fallback ou Sobrescrita se houver lista completa de contratos
        if (contracts && contracts.length > 0) {
            const now = new Date()

            // Verificar se há algum contrato ATIVO hoje
            const hasActive = contracts.some(c => {
                const isStatusActive = (c.status === 'active' || c.status === 'scheduled_cancellation')
                const endDate = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate)
                return isStatusActive && (endDate >= now)
            })

            if (hasActive) return 'active'

            // Verificar se há algum contrato SUSPENSO
            const hasSuspended = contracts.some(c => c.status === 'suspended')
            if (hasSuspended) return 'suspended'

            // Se todos os contratos expiraram ou foram cancelados
            return 'inactive'
        }

        // 4. Determinação de Status Base (Prospecção vs Aluno)
        const hasHistory = (contracts && contracts.length > 0) || !!computed.contractEndDate || !!computed.activeContractId

        if (hasHistory) {
            // Se já teve contrato, o status de funnel (lead) nunca mais é usado
            return 'inactive'
        }

        // 5. Se não tem histórico algum, mantém status de funil (Lead)
        return client.lifecycleStatus || 'lead'
    }
}
