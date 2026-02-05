import { runTransaction, doc, arrayUnion } from 'firebase/firestore'
import { getFirebaseBackend } from '../../helpers/firebase_helper'
import { clientContractRepository } from '../../data/repositories/ClientContractRepository'
import { ClientContractSchema } from '../../data/schemas/Clients/ClientContractSchema'
import { AuditService } from '../Core/AuditService'
import { DashboardSummaryService } from '../Dashboard/DashboardSummaryService'
import { ContractCancellationService } from './ContractCancellationService'
import { generateContractId } from '../../utils/sequence'
import { normalizeDate } from '../../utils/date'
import moment from 'moment'

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
 * NOTA: Cancelamento delegado ao ContractCancellationService
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

        const friendlyId = await generateContractId(idTenant, idBranch)

        const contract = {
            ...contractData,
            friendlyId,
            status: contractData.status || 'active',
            paidInstallments: 0,
            startDate: normalizeDate(contractData.startDate) || new Date(),
            endDate: normalizeDate(contractData.endDate),
            createdBy: userId,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        }

        const existingContracts = await clientContractRepository.findByClient(
            idTenant, idBranch, contractData.idClient
        )
        const isFirstContract = existingContracts.length === 0

        let contractId = null
        const db = ClientContractService.db

        await runTransaction(db, async (transaction) => {
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${friendlyId}`)
            transaction.set(contractRef, contract)
            contractId = contractRef.id

            if (isFirstContract) {
                const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contractData.idClient}`)
                transaction.update(clientRef, {
                    lifecycleStatus: 'active',
                    'lifecycle.convertedAt': normalizeDate(new Date()),
                    'lifecycle.convertedBy': userId,
                    'lifecycle.firstContractId': contractId,
                    'lifecycle.startDate': normalizeDate(contractData.startDate) || normalizeDate(new Date()),
                    updatedAt: normalizeDate(new Date())
                })

                DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                    activeStudents: 1,
                    newStudents: 1,
                    converted: 1
                })
            }
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: contractData.userName,
            action: 'CREATE',
            entityType: 'clientContract',
            entityId: contractId,
            details: { idClient: contractData.idClient, planName: contractData.planName, isFirstContract },
            description: `Contrato ${contractData.planName} criado para o cliente.`
        })

        return contractId
    },

    /**
     * Suspende um contrato temporariamente.
     */
    suspend: async (idTenant, idBranch, userId, idContract, data, reason) => {
        const contract = await clientContractRepository.findById(idTenant, idBranch, idContract)

        if (contract.status !== 'active') {
            throw new Error('Apenas contratos ativos podem ser suspensos')
        }

        const { startDate, endDate, suspensionDays: daysInput } = typeof data === 'object' ? data : { suspensionDays: data }

        let finalStartDate = startDate ? normalizeDate(startDate) : normalizeDate(new Date())
        let finalEndDate = endDate ? normalizeDate(endDate) : null
        let suspensionDays = daysInput

        if (startDate && endDate) {
            suspensionDays = moment(endDate).diff(moment(startDate), 'days')
            finalEndDate = normalizeDate(endDate)
        } else if (suspensionDays) {
            finalEndDate = normalizeDate(moment(finalStartDate).add(suspensionDays, 'days'))
        }

        if (!suspensionDays || suspensionDays <= 0) {
            throw new Error('Período de suspensão inválido')
        }

        const rules = contract.rules || {}
        if (rules.allowFreeze === false) {
            throw new Error('Este plano não permite suspensão')
        }

        const totalUsed = contract.suspension?.totalDaysUsed || 0
        const available = (rules.maxFreezeDays || 0) - totalUsed

        if (rules.maxFreezeDays && suspensionDays > available) {
            throw new Error(`Limite de ${available} dias de suspensão (Usado: ${totalUsed}/${rules.maxFreezeDays})`)
        }

        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)
            const suspensionEntry = {
                id: Math.random().toString(36).substr(2, 9),
                startDate: finalStartDate,
                endDate: finalEndDate,
                intendedDays: suspensionDays,
                reason: reason,
                suspendedAt: normalizeDate(new Date()),
                suspendedBy: userId,
                status: 'ongoing'
            }

            transaction.update(contractRef, {
                status: 'suspended',
                'suspension.isSuspended': true,
                'suspension.current': suspensionEntry,
                'suspension.history': arrayUnion(suspensionEntry),
                updatedAt: normalizeDate(new Date())
            })

            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'suspended',
                updatedAt: normalizeDate(new Date())
            })

            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                activeStudents: -1,
                suspendedStudents: 1
            })
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'SUSPEND',
            entityType: 'clientContract',
            entityId: idContract,
            details: { suspensionDays, reason }
        })

        return true
    },

    /**
     * Ajusta a vigência do contrato.
     */
    adjustDays: async (idTenant, idBranch, userId, idContract, days, mode, reason) => {
        const contract = await clientContractRepository.findById(idTenant, idBranch, idContract)

        if (!['active', 'suspended'].includes(contract.status)) {
            throw new Error('Apenas contratos ativos ou suspensos podem ter a vigência ajustada')
        }

        const currentEndDate = contract.endDate?.toDate ? contract.endDate.toDate() : new Date(contract.endDate)
        const newEndDate = normalizeDate(
            mode === 'add'
                ? moment(currentEndDate).add(days, 'days')
                : moment(currentEndDate).subtract(days, 'days')
        )

        const db = ClientContractService.db
        const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)

        await runTransaction(db, async (transaction) => {
            transaction.update(contractRef, {
                endDate: newEndDate,
                updatedAt: normalizeDate(new Date()),
                'lastAdjustment': { days, mode, reason, adjustedAt: normalizeDate(new Date()), adjustedBy: userId }
            })
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'CONTRACT_DAYS_ADJUSTED',
            entityType: 'clientContract',
            entityId: idContract,
            details: { days, mode, reason, oldEndDate: currentEndDate, newEndDate }
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

        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)
            transaction.update(contractRef, {
                status: 'active',
                'suspension.isSuspended': false,
                updatedAt: normalizeDate(new Date())
            })

            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'active',
                updatedAt: normalizeDate(new Date())
            })

            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                activeStudents: 1,
                suspendedStudents: -1
            })
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'REACTIVATE',
            entityType: 'clientContract',
            entityId: idContract,
            details: {}
        })

        return true
    },

    /**
     * Cancela um contrato definitivamente.
     * Delegado ao ContractCancellationService.
     */
    cancel: async (idTenant, idBranch, userId, idContract, financialData) => {
        return ContractCancellationService.cancel(idTenant, idBranch, userId, idContract, financialData)
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
