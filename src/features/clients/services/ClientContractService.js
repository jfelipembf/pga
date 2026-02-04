import { runTransaction, doc, arrayUnion, query, where, collection, getDocs } from 'firebase/firestore'
import { getFirebaseBackend } from '../../../helpers/firebase_helper'
import { clientContractRepository } from '../repositories/ClientContractRepository'
import { ClientContractSchema } from '../schemas/ClientContractSchema'
import { AuditService } from '../../../services/Audit/AuditService'
import { DashboardSummaryService } from '../../../services/Dashboard/DashboardSummaryService'
import { LedgerService } from '../../../services/Ledger/LedgerService'
import { CashierService } from '../../../services/Financial/CashierService'
import { generateContractId } from '../../../utils/sequence'
import { normalizeDate } from '../../../utils/date'
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
            startDate: normalizeDate(contractData.startDate) || new Date(),
            endDate: normalizeDate(contractData.endDate),
            createdBy: userId,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
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
                    'lifecycle.convertedAt': normalizeDate(new Date()),
                    'lifecycle.convertedBy': userId,
                    'lifecycle.firstContractId': contractId,
                    'lifecycle.startDate': normalizeDate(contractData.startDate) || normalizeDate(new Date()),
                    updatedAt: normalizeDate(new Date())
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
            userName: contractData.userName,
            action: 'CREATE',
            entityType: 'clientContract',
            entityId: contractId,
            details: {
                idClient: contractData.idClient,
                planName: contractData.planName,
                isFirstContract
            },
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

        // Se enviou datas, calcula os dias
        if (startDate && endDate) {
            suspensionDays = moment(endDate).diff(moment(startDate), 'days')
            finalEndDate = normalizeDate(endDate)
        } else if (suspensionDays) {
            finalEndDate = normalizeDate(moment(finalStartDate).add(suspensionDays, 'days'))
        }

        if (!suspensionDays || suspensionDays <= 0) {
            throw new Error('Período de suspensão inválido')
        }

        // Validação de Regras do Plano
        const rules = contract.rules || {}
        if (rules.allowFreeze === false) {
            throw new Error('Este plano não permite suspensão (congelamento)')
        }

        const totalUsed = contract.suspension?.totalDaysUsed || 0
        const available = (rules.maxFreezeDays || 0) - totalUsed

        if (rules.maxFreezeDays && suspensionDays > available) {
            throw new Error(`Este plano permite apenas mais ${available} dias de suspensão (Total usado: ${totalUsed}/${rules.maxFreezeDays})`)
        }

        // Transação: Contract + Client + Dashboard
        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            // Atualiza contrato
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

            // Atualiza cliente
            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'suspended',
                updatedAt: normalizeDate(new Date())
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
     * Ajusta a vigência do contrato adicionando ou debitando dias.
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
                'lastAdjustment': {
                    days,
                    mode,
                    reason,
                    adjustedAt: normalizeDate(new Date()),
                    adjustedBy: userId
                }
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

        // Transação: Contract + Client + Dashboard
        const db = ClientContractService.db
        await runTransaction(db, async (transaction) => {
            // Atualiza contrato
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)
            transaction.update(contractRef, {
                status: 'active',
                'suspension.isSuspended': false,
                updatedAt: normalizeDate(new Date())
            })

            // Atualiza cliente
            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'active',
                updatedAt: normalizeDate(new Date())
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
    cancel: async (idTenant, idBranch, userId, idContract, financialData) => {
        const {
            reason,
            notes,
            cancellationFee,
            effectiveDate,
            cancelFutureReceivables
        } = financialData || {}
        const contract = await clientContractRepository.findById(idTenant, idBranch, idContract)

        if (contract.status === 'cancelled') {
            throw new Error('Contrato já está cancelado')
        }

        // Validação de Permanência Mínima (Apenas informativa/bloqueio se necessário)
        const rules = contract.rules || {}
        if (rules.minPermanence > 0) {
            const startDate = moment(contract.startDate?.seconds ? contract.startDate.seconds * 1000 : contract.startDate)
            const monthsActive = moment().diff(startDate, 'months')

            // Aqui poderíamos ter uma lógica de "Override" se o usuário for admin
            // Mas por enquanto mantemos a flexibilidade já que o modal já avisou
        }

        const wasActive = contract.status === 'active'
        const wasSuspended = contract.status === 'suspended'
        const db = ClientContractService.db

        // 1. Localizar parcelas (receivables) em aberto
        const receivablesRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/receivables`)
        const q = query(receivablesRef,
            where('idSale', '==', contract.idSale),
            where('status', '==', 'open'),
            where('deletedAt', '==', null)
        )
        const receivableDocs = await getDocs(q)

        // Filtro por data se houver data de efetivação
        const effectiveMoment = moment(effectiveDate)
        const docsToCancel = cancelFutureReceivables
            ? receivableDocs.docs.filter(d => {
                const dueDate = d.data().dueDate?.seconds ? moment(d.data().dueDate.seconds * 1000) : moment(d.data().dueDate)
                return dueDate.isSameOrAfter(effectiveMoment, 'day')
            })
            : []

        // Transação: Contract + Client + Dashboard + Receivables
        await runTransaction(db, async (transaction) => {
            // A. Atualiza contrato
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`)
            transaction.update(contractRef, {
                status: 'cancelled',
                'cancellation.canceledAt': normalizeDate(new Date()),
                'cancellation.effectiveDate': normalizeDate(new Date(effectiveDate)),
                'cancellation.canceledBy': userId,
                'cancellation.reason': reason,
                'cancellation.notes': notes,
                'cancellation.feeApplied': parseFloat(cancellationFee) || 0,
                'cancellation.futureReceivablesCanceled': cancelFutureReceivables,
                updatedAt: normalizeDate(new Date())
            })

            // B. Atualiza cliente para 'inactive'
            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                lifecycleStatus: 'inactive',
                updatedAt: normalizeDate(new Date())
            })

            // C. Cancelar parcelas futuras em aberto (respeitando a regra de data e escolha do user)
            docsToCancel.forEach((docSnap) => {
                transaction.update(docSnap.ref, {
                    status: 'cancelled',
                    description: `Cancelado em ${effectiveDate}. Motivo: Encerramento do contrato.`,
                    updatedAt: normalizeDate(new Date())
                })
            })

            // D. Se houver multa, criar novo título a receber
            if (parseFloat(cancellationFee) > 0) {
                const feeRef = doc(collection(db, `tenants/${idTenant}/branches/${idBranch}/receivables`))
                transaction.set(feeRef, {
                    idClient: contract.idClient,
                    clientName: contract.clientName || 'Cliente',
                    idSale: contract.idSale || null,
                    type: 'client',
                    amount: parseFloat(cancellationFee),
                    pending: parseFloat(cancellationFee),
                    paid: 0,
                    dueDate: normalizeDate(new Date()), // Vencimento hoje
                    paymentMethod: 'pending_payment',
                    status: 'open',
                    description: `Multa Rescisória - Contrato: ${contract.planName}`,
                    category: 'penalties',
                    createdAt: normalizeDate(new Date()),
                    updatedAt: normalizeDate(new Date())
                })
            }

            // E. Atualiza dashboard
            const dashboardUpdates = { canceledStudents: 1 }
            if (wasActive) {
                dashboardUpdates.activeStudents = -1
            } else if (wasSuspended) {
                dashboardUpdates.suspendedStudents = -1
            }

            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, dashboardUpdates)
        })

        // --- INTEGRAÇÃO FINANCEIRA PÓS-TRANSAÇÃO ---
        try {
            // 1. DRE: Registrar Multa se houver
            if (parseFloat(cancellationFee) > 0) {
                await LedgerService.createPenaltyEntry(idTenant, idBranch, {
                    contractId: idContract,
                    clientName: contract.clientName || 'Cliente',
                    amount: parseFloat(cancellationFee)
                })
            }

            // 2. DRE: Registrar Estorno de Receita (Dedução) para parcelas canceladas
            let totalCancelledAR = 0
            docsToCancel.forEach(d => totalCancelledAR += (d.data().amount || 0))

            if (totalCancelledAR > 0) {
                await LedgerService.createCancellationDeductionEntry(idTenant, idBranch, {
                    contractId: idContract,
                    clientName: contract.clientName || 'Cliente',
                    saleNumber: contract.idSale,
                    amount: totalCancelledAR
                })
            }

        } catch (finError) {
            console.error("Erro na integração financeira do cancelamento:", finError)
            // Não barramos o cancelamento operacional se o financeiro falhar, mas logamos
        }

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'CANCEL',
            entityType: 'clientContract',
            entityId: idContract,
            details: { ...financialData, actualCanceledReceivables: receivableDocs.size }
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
