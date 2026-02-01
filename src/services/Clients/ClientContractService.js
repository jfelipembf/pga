import { runTransaction, doc } from 'firebase/firestore'
import { getFirebaseBackend } from '../../helpers/firebase_helper'
import { clientContractRepository } from '../../data/repositories/ClientContractRepository'
import { ClientContractSchema } from '../../data/schemas/ClientContractSchema'
import { AuditService } from '../Audit/AuditService'
import { DashboardSummaryService } from '../Dashboard/DashboardSummaryService'
import { generateContractId } from '../../utils/sequence'
import moment from 'moment'

/**
 * Serviço de Contratos de Cliente.
 * Usa transações atômicas para garantir consistência entre Contract, Client e Dashboard.
 */
export const ClientContractService = {

    /**
     * Getter para o banco de dados
     */
    get db() {
        const backend = getFirebaseBackend()
        if (!backend) {
            throw new Error("Firebase Backend não inicializado")
        }
        return backend.db
    },

    /**
     * Cria um novo contrato e atualiza o cliente para 'active'.
     * Usa transação para garantir atomicidade.
     */
    create: async (idTenant, idBranch, userId, contractData) => {
        // 1. Validação
        await ClientContractSchema.validate(contractData)

        // 2. Gera ID amigável (ex: C00001, C00002)
        const friendlyId = await generateContractId(idTenant, idBranch)

        // 3. Prepara dados
        const contract = {
            ...contractData,
            friendlyId, // ID amigável para exibição
            status: contractData.status || 'active',
            paidInstallments: 0,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        // 4. Verifica se é o primeiro contrato do cliente
        const existingContracts = await clientContractRepository.findByClient(
            idTenant,
            idBranch,
            contractData.idClient
        )
        const isFirstContract = existingContracts.length === 0

        let contractId = null

        // 5. Transação atômica: Contrato + Cliente + Dashboard
        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            // Cria contrato com ID amigável
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${friendlyId}`)
            transaction.set(contractRef, contract)
            contractId = contractRef.id

            // Se é o primeiro contrato, atualiza cliente para 'active'
            if (isFirstContract) {
                const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contractData.idClient}`)
                transaction.update(clientRef, {
                    lifecycleStatus: 'active',
                    'lifecycle.convertedAt': new Date(),
                    'lifecycle.convertedBy': userId,
                    'lifecycle.firstContractId': contractId,
                    updatedAt: new Date()
                })

                // Incrementa dashboard
                DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                    activeStudents: 1,
                    newStudents: 1,
                    converted: 1
                })
            }
        })

        // 5. Auditoria (fora da transação, não é crítico)
        await AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'CREATE',
            entityType: 'clientContract',
            entityId: contractId,
            details: {
                idClient: contractData.idClient,
                planName: contractData.planName,
                isFirstContract
            }
        })

        return contractId
    },

    /**
     * Suspende um contrato temporariamente.
     */
    suspend: async (idTenant, idBranch, userId, idContract, suspensionDays, reason) => {
        const contract = await clientContractRepository.findById(idTenant, idBranch, idContract)

        if (contract.status !== 'active') {
            throw new Error('Apenas contratos ativos podem ser suspensos')
        }

        const suspensionEndDate = moment().add(suspensionDays, 'days').toDate()

        // Transação: Contract + Client + Dashboard
        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            // Atualiza contrato
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)
            transaction.update(contractRef, {
                status: 'suspended',
                'suspension.isSuspended': true,
                'suspension.suspendedAt': new Date(),
                'suspension.suspendedBy': userId,
                'suspension.suspensionDays': suspensionDays,
                'suspension.suspensionEndDate': suspensionEndDate,
                'suspension.reason': reason,
                updatedAt: new Date()
            })

            // Atualiza cliente
            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'suspended',
                updatedAt: new Date()
            })

            // Atualiza dashboard
            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                activeStudents: -1,
                suspendedStudents: 1
            })
        })

        await AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'SUSPEND',
            entityType: 'clientContract',
            entityId: idContract,
            details: { suspensionDays, reason }
        })

        return true
    },

    /**
     * Reativa um contrato suspenso.
     */
    reactivate: async (idTenant, idBranch, userId, idContract) => {
        const contract = await clientContractRepository.findById(idTenant, idBranch, idContract)

        if (contract.status !== 'suspended') {
            throw new Error('Apenas contratos suspensos podem ser reativados')
        }

        // Transação: Contract + Client + Dashboard
        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            // Atualiza contrato
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)
            transaction.update(contractRef, {
                status: 'active',
                'suspension.isSuspended': false,
                updatedAt: new Date()
            })

            // Atualiza cliente
            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'active',
                updatedAt: new Date()
            })

            // Atualiza dashboard
            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                activeStudents: 1,
                suspendedStudents: -1
            })
        })

        await AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'REACTIVATE',
            entityType: 'clientContract',
            entityId: idContract,
            details: {}
        })

        return true
    },

    /**
     * Cancela um contrato definitivamente.
     */
    cancel: async (idTenant, idBranch, userId, idContract, reason, notes) => {
        const contract = await clientContractRepository.findById(idTenant, idBranch, idContract)

        if (contract.status === 'canceled') {
            throw new Error('Contrato já está cancelado')
        }

        const wasActive = contract.status === 'active'
        const wasSuspended = contract.status === 'suspended'

        // Transação: Contract + Client + Dashboard
        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            // Atualiza contrato
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)
            transaction.update(contractRef, {
                status: 'canceled',
                'cancellation.canceledAt': new Date(),
                'cancellation.canceledBy': userId,
                'cancellation.reason': reason,
                'cancellation.notes': notes,
                updatedAt: new Date()
            })

            // Atualiza cliente para 'inactive'
            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'inactive',
                updatedAt: new Date()
            })

            // Atualiza dashboard
            const dashboardUpdates = { canceledStudents: 1 }
            if (wasActive) {
                dashboardUpdates.activeStudents = -1
            } else if (wasSuspended) {
                dashboardUpdates.suspendedStudents = -1
            }

            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, dashboardUpdates)
        })

        await AuditService.log({
            idTenant,
            idBranch,
            userId,
            action: 'CANCEL',
            entityType: 'clientContract',
            entityId: idContract,
            details: { reason, notes }
        })

        return true
    },

    /**
     * Lista contratos de um cliente.
     */
    listByClient: async (idTenant, idBranch, idClient) => {
        return await clientContractRepository.findByClient(idTenant, idBranch, idClient)
    },

    /**
     * Busca contrato por ID.
     */
    getById: async (idTenant, idBranch, idContract) => {
        return await clientContractRepository.findById(idTenant, idBranch, idContract)
    }
}
