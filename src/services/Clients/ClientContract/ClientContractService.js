import { runTransaction, doc } from 'firebase/firestore'
import { getFirebaseBackend } from '../../../helpers/firebase_helper'
import { clientContractRepository } from '../../../data/repositories/ClientContractRepository'
import { ServiceContextHelper } from '../../Core/DataAggregationHelper'
import { ClientContractSchema } from '../../../data/schemas/Clients/ClientContractSchema'
import { ClientContractAuditLogger } from './audit/ClientContractAuditLogger'
import { ClientContractSalesClassificationRules } from './domain/ClientContractSalesClassificationRules'
import { ClientContractAdjustmentRules } from './domain/ClientContractAdjustmentRules'
import { ClientContractCancellationRules } from './domain/ClientContractCancellationRules'
import { DashboardSummaryService } from '../../Dashboard/DashboardSummaryService'
import { ClientContractCancellationService } from './ClientContractCancellationService'
import { ClientContractSuspensionService } from './ClientContractSuspensionService'
import { generateClientContractId } from '../../../utils/sequence'
import { normalizeDate } from '../../../utils/date'
import { CLIENT_STATUS, CLIENT_CONTRACT_STATUS, LIFECYCLE_STATUS } from '../../../utils/constants'
import { ClientService } from '../ClientService'

/**
 * Serviço de Contratos de Cliente.
 * Usa transações atômicas para garantir consistência entre Contract, Client e Dashboard.
 * 
 * Responsabilidades:
 * - Criar contratos (create)
 * - Suspender contratos (suspend)
 * - Reativar contratos (reactivate)
 * - Ajustar vigência (adjustDays)
 * - Consultas (listByClient, getById)
 * 
 * NOTA: Cancelamento delegado ao ClientContractCancellationService
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
     */
    create: async (idTenant, idBranch, userId, contractData) => {
        await ClientContractSchema.validate(contractData)

        const idClientContract = await generateClientContractId(idTenant, idBranch)
        const db = ClientContractService.db

        const contract = {
            idClientContract,
            idClient: contractData.idClient,
            clientName: contractData.clientName || 'Cliente', // Desnormalização de cache
            idContract: contractData.idContract,
            idSale: contractData.idSale || null,
            planName: contractData.planName,
            planType: contractData.planType,
            startDate: normalizeDate(contractData.startDate) || new Date(),
            endDate: normalizeDate(contractData.endDate),

            // Financeiro
            originalValue: contractData.originalValue || 0,
            discount: contractData.discount || 0,
            value: contractData.value || 0,
            totalValue: contractData.totalValue || 0,
            installments: contractData.installments || 1,
            paidInstallments: 0,

            // Status e Identificação
            status: contractData.status || CLIENT_CONTRACT_STATUS.ACTIVE,
            userName: contractData.userName,

            // Novas Estruturas Organizacionais
            suspension: {
                isSuspended: false,
                totalDaysUsed: 0,
                current: null,
                history: []
            },
            cancellation: {
                canceledAt: null,
                effectiveDate: null,
                canceledBy: null,
                reason: null,
                feeApplied: 0,
                futureReceivablesCanceled: false
            },

            // Regras (Snapshot)
            rules: contractData.rules || {},

            createdBy: userId,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
        }

        const existingContracts = await clientContractRepository.findByClient(
            idTenant, idBranch, contractData.idClient
        )
        // Ordena por data de término decrescente para pegar o último
        existingContracts.sort((a, b) => {
            const dateA = a.endDate?.toDate ? a.endDate.toDate() : new Date(a.endDate)
            const dateB = b.endDate?.toDate ? b.endDate.toDate() : new Date(b.endDate)
            return dateB - dateA
        })

        const lastContract = existingContracts[0]
        let previousContractId = null

        if (lastContract) {
            previousContractId = lastContract.idClientContract || lastContract.id
        }

        const lastEndDate = lastContract ? lastContract.endDate : null
        const salesClassification = ClientContractSalesClassificationRules.classify(lastEndDate, contractData.startDate)

        contract.salesClassification = salesClassification
        contract.previousContractId = previousContractId

        const isFirstContract = salesClassification === 'new'

        await runTransaction(db, async (transaction) => {
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idClientContract}`)
            transaction.set(contractRef, contract)

            // Atualiza status do Cliente
            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contractData.idClient}`)
            const clientUpdates = {
                status: CLIENT_STATUS.ACTIVE,
                lifecycleStatus: LIFECYCLE_STATUS.CONVERTED,
                updatedAt: normalizeDate(new Date())
            }

            // Metadados apenas para primeira conversão
            if (isFirstContract) {
                clientUpdates['lifecycle.convertedAt'] = normalizeDate(new Date())
                clientUpdates['lifecycle.convertedBy'] = userId
                clientUpdates['lifecycle.firstContractId'] = idClientContract
                clientUpdates['lifecycle.startDate'] = normalizeDate(contractData.startDate) || normalizeDate(new Date())
            }

            transaction.update(clientRef, clientUpdates)

            // Atualiza Dashboard: Incrementa conforme classificação
            const dashboardUpdates = {
                activeclients: 1 // Novo contrato vigente sempre incrementa ativo
            }

            if (salesClassification === 'new') {
                dashboardUpdates.newclients = 1
                dashboardUpdates.converted = 1
                dashboardUpdates.leads = -1
            } else if (salesClassification === 'renewal') {
                dashboardUpdates.renewals = 1
            } else if (salesClassification === 'winback') {
                dashboardUpdates.winbacks = 1
            }

            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, dashboardUpdates)
        })

        await ClientContractAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: contractData.userName,
            idClientContract, contractData, isFirstContract, salesClassification, previousContractId
        })

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, contractData.idClient)

        return idClientContract
    },

    /**
     * Suspende um contrato temporariamente.
     * Delegado ao ClientContractSuspensionService.
     */
    suspend: async (idTenant, idBranch, userId, idClientContract, data, reason) => {
        return ClientContractSuspensionService.suspend(idTenant, idBranch, userId, idClientContract, data, reason)
    },

    /**
     * Ajusta a vigência do contrato.
     */
    adjustDays: async (idTenant, idBranch, userId, idClientContract, days, mode, reason) => {
        const contract = await ServiceContextHelper.getContractContext(idTenant, idBranch, idClientContract)

        const { oldEndDate, newEndDate } = ClientContractAdjustmentRules.calculateNewEndDate(contract, days, mode)

        const db = ClientContractService.db
        const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idClientContract}`)

        await runTransaction(db, async (transaction) => {
            transaction.update(contractRef, {
                endDate: newEndDate,
                updatedAt: normalizeDate(new Date()),
                'lastAdjustment': { days, mode, reason, adjustedAt: normalizeDate(new Date()), adjustedBy: userId }
            })
        })

        await ClientContractAuditLogger.logDaysAdjustment({
            idTenant, idBranch, userId, idClientContract, days, mode, reason, oldEndDate, newEndDate
        })

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, contract.idClient)

        return true
    },

    /**
     * Reativa um contrato suspenso.
     * Delegado ao ClientContractSuspensionService.
     */
    reactivate: async (idTenant, idBranch, userId, idClientContract) => {
        return ClientContractSuspensionService.reactivate(idTenant, idBranch, userId, idClientContract)
    },

    /**
     * Cancela um contrato definitivamente.
     * Delegado ao ClientContractCancellationService.
     */
    cancel: async (idTenant, idBranch, userId, idClientContract, financialData) => {
        const { isFuture, effectiveDate } = ClientContractCancellationRules.getExecutionType(financialData?.effectiveDate)

        if (isFuture) {
            return ClientContractCancellationService.scheduleCancellation(idTenant, idBranch, userId, idClientContract, {
                cancelDate: effectiveDate,
                reason: financialData.reason,
                notes: financialData.notes
            })
        }

        return ClientContractCancellationService.cancel(idTenant, idBranch, userId, idClientContract, {
            ...financialData,
            effectiveDate // Garante data normalizada
        })
    },

    /**
     * Lista contratos de um cliente.
     */
    listByClient: async (idTenant, idBranch, idClient) => {
        const { clientContractRepository } = await import('../../../data/repositories/ClientContractRepository');
        return await clientContractRepository.findByClient(idTenant, idBranch, idClient)
    },

    getById: async (idTenant, idBranch, idClientContract) => {
        return await ServiceContextHelper.getContractContext(idTenant, idBranch, idClientContract)
    }
};
