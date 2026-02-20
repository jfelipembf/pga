import { runTransaction, doc, query, where, collection, getDocs } from 'firebase/firestore'
import { getFirebaseBackend } from '../../../helpers/firebase_helper'
import { ServiceContextHelper } from '../../Core/DataAggregationHelper'
import { ClientContractAuditLogger } from './audit/ClientContractAuditLogger'
import { ClientContractCancellationRules } from './domain/ClientContractCancellationRules'
import { DashboardSummaryService } from '../../Dashboard/DashboardSummaryService'
import { LedgerService } from '../../Ledger/LedgerService'
import { ClientService } from '../ClientService'
import { normalizeDate, parseDateInput } from '../../../utils/date'
import { CLIENT_STATUS, CLIENT_CONTRACT_STATUS, RECEIVABLE_STATUS } from '../../../utils/constants'

/**
 * Serviço dedicado ao Cancelamento de Contratos
 * Separado do ClientContractService para manter responsabilidade única
 * 
 * Responsabilidades:
 * - Cancelar contrato
 * - Cancelar parcelas futuras
 * - Gerar multa rescisória
 * - Atualizar dashboard
 * - Registrar lançamentos contábeis
 */
export const ClientContractCancellationService = {

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
     * Cancela um contrato definitivamente.
     * 
     * @param {string} idTenant - ID do tenant
     * @param {string} idBranch - ID da filial
     * @param {string} userId - ID do usuário que está cancelando
     * @param {string} idClientContract - ID do contrato a ser cancelado
     * @param {object} financialData - Dados financeiros do cancelamento
     * @param {string} financialData.reason - Motivo do cancelamento
     * @param {string} financialData.notes - Observações adicionais
     * @param {number} financialData.cancellationFee - Valor da multa rescisória
     * @param {Date} financialData.effectiveDate - Data efetiva do cancelamento
     * @param {boolean} financialData.cancelFutureReceivables - Se deve cancelar parcelas futuras
     * @returns {Promise<boolean>}
     */
    cancel: async (idTenant, idBranch, userId, idClientContract, financialData) => {
        const {
            cancellationFee,
            effectiveDate,
            cancelFutureReceivables
        } = financialData || {}

        // 1. Buscar contrato via Helper
        const contract = await ServiceContextHelper.getContractContext(idTenant, idBranch, idClientContract)

        // 2. Validações
        ClientContractCancellationRules.validate(contract)

        const wasActive = contract.status === CLIENT_CONTRACT_STATUS.ACTIVE
        const wasSuspended = contract.status === CLIENT_CONTRACT_STATUS.SUSPENDED
        const db = ClientContractCancellationService.db

        // 3. Buscar parcelas em aberto
        const docsToCancel = await ClientContractCancellationService._findReceivablesToCancel(
            db, idTenant, idBranch, contract.idSale, effectiveDate, cancelFutureReceivables
        )

        // 4. Transação atômica
        await runTransaction(db, async (transaction) => {
            // A. Cancelar contrato
            ClientContractCancellationService._cancelContractInTransaction(
                transaction, idTenant, idBranch, idClientContract, userId, financialData
            )

            // B. Atualizar cliente para 'inactive'
            ClientContractCancellationService._updateClientStatusInTransaction(
                transaction, idTenant, idBranch, contract.idClient
            )

            // C. Cancelar parcelas futuras
            docsToCancel.forEach((docSnap) => {
                transaction.update(docSnap.ref, {
                    status: RECEIVABLE_STATUS.CANCELLED,
                    description: `Cancelado em ${effectiveDate}. Motivo: Encerramento do contrato.`,
                    updatedAt: normalizeDate(new Date())
                })
            })

            // D. Criar recebível de multa se houver
            if (parseFloat(cancellationFee) > 0) {
                ClientContractCancellationService._createPenaltyReceivableInTransaction(
                    transaction, idTenant, idBranch, contract, cancellationFee
                )
            }

            // E. Atualizar dashboard
            ClientContractCancellationService._updateDashboardInTransaction(
                transaction, idTenant, idBranch, wasActive, wasSuspended
            )
        })

        // 5. Lançamentos contábeis (fora da transação)
        await ClientContractCancellationService._registerLedgerEntries(
            idTenant, idBranch, idClientContract, contract, cancellationFee, docsToCancel
        )

        // 5.5 Cancelar Matrículas vinculadas ao contrato
        try {
            const { EnrollmentService } = await import('../EnrollmentService')
            const enrollmentsSnap = await getDocs(query(
                collection(db, `tenants/${idTenant}/branches/${idBranch}/enrollments`),
                where('idClientContract', '==', idClientContract),
                where('status', 'in', [CLIENT_STATUS.ACTIVE, CLIENT_STATUS.SUSPENDED])
            ))

            for (const docSnap of enrollmentsSnap.docs) {
                await EnrollmentService.cancelEnrollment(idTenant, idBranch, { uid: userId }, docSnap.id, financialData?.reason || 'Cancelamento de Contrato')
            }
        } catch (err) {
            console.error("[ContractCancellation] Erro ao cancelar matrículas vinculadas:", err)
        }

        // 6. Auditoria
        await ClientContractAuditLogger.logCancellation({
            idTenant, idBranch, userId, idClientContract, financialData, actualCanceledReceivables: docsToCancel.length
        })

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, contract.idClient)

        return true
    },

    /**
     * Agenda o cancelamento de um contrato para uma data futura.
     * 
     * @param {string} idTenant - ID do tenant
     * @param {string} idBranch - ID da filial
     * @param {string} userId - ID do usuário
     * @param {string} idClientContract - ID do contrato
     * @param {object} scheduleData - Dados do agendamento
     * @param {string} scheduleData.cancelDate - Data para o cancelamento (YYYY-MM-DD)
     * @param {string} scheduleData.reason - Motivo
     * @param {string} scheduleData.notes - Observações
     */
    scheduleCancellation: async (idTenant, idBranch, userId, idClientContract, scheduleData) => {
        const { cancelDate, reason, notes } = scheduleData
        const db = ClientContractCancellationService.db

        const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idClientContract}`)

        await runTransaction(db, async (transaction) => {
            transaction.update(contractRef, {
                status: CLIENT_CONTRACT_STATUS.SCHEDULED_CANCELLATION,
                cancelDate: cancelDate,
                'cancellation.scheduledAt': normalizeDate(new Date()),
                'cancellation.scheduledBy': userId,
                'cancellation.reason': reason,
                'cancellation.notes': notes,
                updatedAt: normalizeDate(new Date())
            })
        })

        await ClientContractAuditLogger.logScheduledCancellation({
            idTenant, idBranch, userId, idClientContract, scheduleData
        })

        const contract = await ServiceContextHelper.getContractContext(idTenant, idBranch, idClientContract)
        if (contract?.idClient) {
            ClientService.syncComputedFields(idTenant, idBranch, contract.idClient)
        }

        return true
    },

    // MÉTODOS PRIVADOS (HELPERS)
    // =========================================

    /**
     * Busca parcelas a serem canceladas
     */
    _findReceivablesToCancel: async (db, idTenant, idBranch, idSale, effectiveDate, cancelFutureReceivables) => {
        if (!cancelFutureReceivables) return []

        const receivablesRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/receivables`)
        const q = query(receivablesRef,
            where('idSale', '==', idSale),
            where('status', '==', RECEIVABLE_STATUS.OPEN),
            where('deletedAt', '==', null)
        )
        const receivableDocs = await getDocs(q)

        return ClientContractCancellationRules.filterReceivablesToCancel(
            receivableDocs.docs,
            effectiveDate,
            cancelFutureReceivables
        )
    },

    /**
     * Cancela o contrato na transação
     */
    _cancelContractInTransaction: (transaction, idTenant, idBranch, idClientContract, userId, financialData) => {
        const { reason, notes, cancellationFee, effectiveDate, cancelFutureReceivables } = financialData
        const contractRef = doc(
            ClientContractCancellationService.db,
            `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idClientContract}`
        )

        transaction.update(contractRef, {
            status: CLIENT_CONTRACT_STATUS.CANCELLED,
            'cancellation.canceledAt': normalizeDate(new Date()),
            'cancellation.effectiveDate': parseDateInput(effectiveDate),
            'cancellation.canceledBy': userId,
            'cancellation.reason': reason,
            'cancellation.notes': notes,
            'cancellation.feeApplied': parseFloat(cancellationFee) || 0,
            'cancellation.futureReceivablesCanceled': cancelFutureReceivables,
            updatedAt: normalizeDate(new Date())
        })
    },

    /**
     * Atualiza status do cliente para inactive
     */
    _updateClientStatusInTransaction: (transaction, idTenant, idBranch, idClient) => {
        const clientRef = doc(
            ClientContractCancellationService.db,
            `tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`
        )

        transaction.update(clientRef, {
            status: CLIENT_STATUS.INACTIVE,
            updatedAt: normalizeDate(new Date())
        })
    },

    /**
     * Cria recebível de multa rescisória
     */
    _createPenaltyReceivableInTransaction: (transaction, idTenant, idBranch, contract, cancellationFee) => {
        const feeRef = doc(collection(
            ClientContractCancellationService.db,
            `tenants/${idTenant}/branches/${idBranch}/receivables`
        ))

        transaction.set(feeRef, {
            idClient: contract.idClient,
            clientName: contract.clientName || 'Cliente',
            idSale: contract.idSale || null,
            type: 'client',
            amount: parseFloat(cancellationFee),
            pending: parseFloat(cancellationFee),
            paid: 0,
            dueDate: normalizeDate(new Date()),
            paymentMethod: 'pending_payment',
            status: RECEIVABLE_STATUS.OPEN,
            description: `Multa Rescisória - Contrato: ${contract.planName}`,
            category: 'penalties',
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        })
    },

    /**
     * Atualiza contadores do dashboard
     */
    _updateDashboardInTransaction: (transaction, idTenant, idBranch, wasActive, wasSuspended) => {
        const dashboardUpdates = { canceledclients: 1 }

        if (wasActive) {
            dashboardUpdates.activeclients = -1
        } else if (wasSuspended) {
            dashboardUpdates.suspendedclients = -1
        }

        DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, dashboardUpdates)
    },

    /**
     * Registra lançamentos contábeis (DRE)
     */
    _registerLedgerEntries: async (idTenant, idBranch, idClientContract, contract, cancellationFee, docsToCancel) => {
        try {
            // 1. Multa rescisória
            if (parseFloat(cancellationFee) > 0) {
                await LedgerService.createPenaltyEntry(idTenant, idBranch, {
                    idClientContract: idClientContract,
                    clientName: contract.clientName || 'Cliente',
                    amount: parseFloat(cancellationFee)
                })
            }

            // 2. Estorno de receita (parcelas canceladas)
            let totalCancelledAR = 0
            docsToCancel.forEach(d => totalCancelledAR += (d.data().amount || 0))

            if (totalCancelledAR > 0) {
                await LedgerService.createCancellationDeductionEntry(idTenant, idBranch, {
                    idClientContract: idClientContract,
                    clientName: contract.clientName || 'Cliente',
                    saleNumber: contract.idSale,
                    amount: totalCancelledAR
                })
            }
        } catch (finError) {
            console.error("[ClientContractCancellationService] Erro na integração financeira:", finError)
            // Não barramos o cancelamento operacional se o financeiro falhar
        }
    }
}
