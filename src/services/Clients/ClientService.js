import { clientRepository } from '../../data/repositories/ClientRepository'
import { ClientSchema } from '../../data/schemas/Clients/ClientSchema'
import { generateClientId } from '../../utils/sequence'
import { normalizeDate } from '../../utils/date'
import { ClientHelper } from './helpers/ClientHelper'
import { CLIENT_STATUS, LIFECYCLE_STATUS } from '../../utils/constants'

// Domain Rules
import { ClientDeletionRules } from './domain/ClientDeletionRules'
import { ClientLifecycleRules } from './domain/ClientLifecycleRules'
import { ClientComputedFieldsRules } from './domain/ClientComputedFieldsRules'

// Audit Logger
import { ClientAuditLogger } from './audit/ClientAuditLogger'

// Dashboard
import { DashboardSummaryService } from '../Dashboard/DashboardSummaryService'

/**
 * Serviço de Clientes — CRUD, Identidade e Sincronização de Dados.
 * 
 * Responsabilidades:
 * - Criar, listar, buscar, atualizar e excluir clientes
 * - Validação de schema
 * - Geração de IDs amigáveis
 * - Sincronização de campos computados (denormalização)
 * - Cálculo do status operacional (Fonte Única de Verdade)
 * - Atualização do Dashboard na criação/exclusão
 * 
 * NOTA: Gerenciamento do Funil de Vendas (lifecycle transitions)
 *       é responsabilidade do ClientLifecycleService.
 */
export const ClientService = {
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
        const all = await clientRepository.findActive(idTenant, idBranch)

        const results = all.filter(c => {
            const computed = c.computed || {}
            return computed.searchText && computed.searchText.includes(lowerTerm)
        }).slice(0, 15)

        return results
    },

    /**
     * Cria um novo cliente com validação e auditoria.
     */
    createClient: async (idTenant, idBranch, userId, rawData) => {
        try {
            // 1. Preparação Otimizada via Helper
            const clientData = ClientHelper.prepareForSave(rawData)

            // 2. Validação Schema
            await ClientSchema.validate(clientData, { abortEarly: false })

            // 3. Gerar ID Amigável (GYM ID)
            const idClient = await generateClientId(idTenant, idBranch)

            // 4. Definir Estado Inicial (Sempre LEAD na criação)
            const initialStatus = ClientLifecycleRules.getInitialStatus({ userId })

            // 5. Persistência (Data Layer)
            const newClient = await clientRepository.create(idTenant, idBranch, {
                ...clientData,
                ...initialStatus,
                idClient,
                computed: {
                    activeContracts: [],
                    activeActivities: [],
                    activeInstructors: [],
                    searchText: ClientHelper.generateSearchText({ ...clientData, idClient }),
                    updatedAt: normalizeDate(new Date())
                }
            })

            // 6. Atualizar Dashboard Summary (Novo Lead)
            await DashboardSummaryService.update(idTenant, idBranch, {
                leads: 1,
                newLeads: 1
            })

            // 7. Auditoria
            await ClientAuditLogger.logCreation({
                idTenant,
                idBranch,
                userId,
                userName: rawData.userName,
                userPhoto: rawData.userPhoto,
                client: newClient
            })

            return newClient
        } catch (error) {
            console.error("Erro no ClientService.createClient:", error)
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
            // 1. Preparação Otimizada via Helper
            const clientData = ClientHelper.prepareForSave(rawData)

            // 2. Validação Schema
            await ClientSchema.validate(clientData, { abortEarly: false })

            // 3. Persistência
            await clientRepository.update(idTenant, idBranch, idClient, clientData)

            // 4. Auditoria
            await ClientAuditLogger.logUpdate({
                idTenant,
                idBranch,
                userId,
                userName: rawData.userName,
                userPhoto: rawData.userPhoto,
                idClient,
                clientData
            })

            return { id: idClient, ...clientData }
        } catch (error) {
            console.error("Erro no ClientService.updateClient:", error)
            throw error
        }
    },

    /**
     * Deleta um cliente com verificação de segurança e auditoria (Soft Delete).
     * O sistema impede exclusão se houver contratos ativos ou dívidas.
     */
    deleteClient: async (idTenant, idBranch, userId, id, userName = null, userPhoto = null) => {
        // 1. Busca estado atual
        const client = await clientRepository.findById(idTenant, idBranch, id)

        // 2. CHECK: Contratos Ativos
        const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository')
        const activeContracts = await clientContractRepository.findByClient(idTenant, idBranch, id)
        const activeContractsCount = activeContracts.filter(c => c.status === 'active' || c.status === 'suspended').length

        // 3. CHECK: Financeiro em Aberto
        const { receivableRepository } = await import('../../data/repositories/ReceivableRepository')
        const openReceivables = await receivableRepository.findWhere(idTenant, idBranch, [
            ['idClient', '==', id],
            ['status', '==', 'open'],
            ['deletedAt', '==', null]
        ])

        // 4. Aplica Regras de Negócio (Domain Layer)
        ClientDeletionRules.validate(client, activeContractsCount, openReceivables.length)

        // 5. Executa Soft Delete
        await clientRepository.softDelete(idTenant, idBranch, id, userId)

        // 6. Atualizar Dashboard Summary (Remove Lead da base ativa)
        if (client.lifecycleStatus === LIFECYCLE_STATUS.LEAD) {
            await DashboardSummaryService.update(idTenant, idBranch, {
                leads: -1
            })
        }

        // 7. Auditoria
        await ClientAuditLogger.logDeletion({
            idTenant, idBranch, userId, userName, userPhoto,
            client
        })

        return id
    },

    /**
     * Sincroniza os campos computados (denormalização) do cliente.
     * Deve ser chamado sempre que houver alteração em contratos ou matrículas.
     */
    syncComputedFields: async (idTenant, idBranch, idClient) => {
        try {
            const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository')
            const { enrollmentRepository } = await import('../../data/repositories/EnrollmentRepository')

            // 1. Buscar Contexto (Aluno, Contratos, Matrículas)
            const client = await clientRepository.findById(idTenant, idBranch, idClient)
            if (!client) return

            const contracts = await clientContractRepository.findByClient(idTenant, idBranch, idClient)
            const enrollments = await enrollmentRepository.findActiveByClient(idTenant, idBranch, idClient)

            // 2. Calcular Campos Computados (Domain Layer)
            const computed = ClientComputedFieldsRules.buildComputedObject(client, contracts, enrollments)

            // 3. Atualizar Cliente no Banco
            await clientRepository.update(idTenant, idBranch, idClient, { computed })

            console.log(`✅ [ClientService] Campos computados sincronizados para: ${client.name}`)
        } catch (error) {
            console.error(`❌ [ClientService] Erro ao sincronizar campos computados do cliente ${idClient}:`, error)
        }
    },

    /**
     * Define o status operacional real do cliente (Fonte Única de Verdade).
     */
    calculateLiveStatus: (client) => {
        if (!client) return null
        return client.status || CLIENT_STATUS.LEAD
    }
}
