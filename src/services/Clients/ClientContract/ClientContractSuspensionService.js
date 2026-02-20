import { runTransaction, doc, arrayUnion } from 'firebase/firestore'
import { getFirebaseBackend } from '../../../helpers/firebase_helper'
import { ServiceContextHelper } from '../../Core/DataAggregationHelper'
import { ClientContractAuditLogger } from './audit/ClientContractAuditLogger'
import { ClientContractSuspensionRules } from './domain/ClientContractSuspensionRules'
import { DashboardSummaryService } from '../../Dashboard/DashboardSummaryService'
import { normalizeDate } from '../../../utils/date'
import { CLIENT_STATUS, CLIENT_CONTRACT_STATUS } from '../../../utils/constants'
import { ClientService } from '../ClientService'

/**
 * Serviço dedicado a Suspensão e Reativação de Contratos de Cliente
 * Separado do ClientContractService para manter responsabilidade única
 */
export const ClientContractSuspensionService = {
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
     * Suspende um contrato temporariamente.
     */
    suspend: async (idTenant, idBranch, userId, idClientContract, data, reason) => {
        const contract = await ServiceContextHelper.getContractContext(idTenant, idBranch, idClientContract)

        const {
            finalStartDate,
            finalEndDate,
            suspensionDays,
            isFuture
        } = ClientContractSuspensionRules.validateAndCalculate(contract, data)

        const db = ClientContractSuspensionService.db
        await runTransaction(db, async (transaction) => {
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idClientContract}`)

            const suspensionEntry = {
                id: Math.random().toString(36).substr(2, 9),
                startDate: finalStartDate,
                endDate: finalEndDate,
                intendedDays: suspensionDays,
                reason: reason,
                suspendedAt: normalizeDate(new Date()),
                suspendedBy: userId,
                status: isFuture ? 'scheduled' : CLIENT_STATUS.ACTIVE
            }

            if (isFuture) {
                // AGENDA: Cria apenas a sub-coleção e marca o contrato com uma flag de agendamento se necessário
                // Mas a Cloud Function varre o collectionGroup 'suspensions' atrás de status 'scheduled'
                const subRef = doc(db, `${contractRef.path}/suspensions/${suspensionEntry.id}`)
                transaction.set(subRef, suspensionEntry)

                transaction.update(contractRef, {
                    updatedAt: normalizeDate(new Date())
                })
            } else {
                // IMEDIATO: Mantém a estrutura atual mas atualiza o campo de histórico principal
                transaction.update(contractRef, {
                    status: CLIENT_CONTRACT_STATUS.SUSPENDED,
                    'suspension.isSuspended': true,
                    'suspension.current': suspensionEntry,
                    'suspension.history': arrayUnion(suspensionEntry),
                    updatedAt: normalizeDate(new Date())
                })

                const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
                transaction.update(clientRef, {
                    status: CLIENT_STATUS.SUSPENDED,
                    updatedAt: normalizeDate(new Date())
                })

                DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                    activeclients: -1,
                    suspendedclients: 1
                })
            }
        })

        // Atualizar também o status das matrículas associadas
        if (!isFuture) {
            try {
                const { getDocs, query, collection, where, updateDoc } = await import('firebase/firestore')
                const enrollmentsSnap = await getDocs(query(
                    collection(db, `tenants/${idTenant}/branches/${idBranch}/enrollments`),
                    where('idClientContract', '==', idClientContract),
                    where('status', '==', CLIENT_STATUS.ACTIVE)
                ))
                for (const docSnap of enrollmentsSnap.docs) {
                    await updateDoc(docSnap.ref, { status: CLIENT_STATUS.SUSPENDED, updatedAt: normalizeDate(new Date()) })
                }
            } catch (err) {
                console.error("[ClientContractSuspensionService] Erro ao suspender matrículas:", err)
            }
        }

        await ClientContractAuditLogger.logSuspension({
            idTenant, idBranch, userId, idClientContract, suspensionDays, reason
        })

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, contract.idClient)

        return true
    },

    /**
     * Reativa um contrato suspenso.
     */
    reactivate: async (idTenant, idBranch, userId, idClientContract) => {
        const contract = await ServiceContextHelper.getContractContext(idTenant, idBranch, idClientContract)

        if (contract.status !== CLIENT_CONTRACT_STATUS.SUSPENDED) {
            throw new Error('Apenas contratos suspensos podem ser reativados')
        }

        const db = ClientContractSuspensionService.db
        await runTransaction(db, async (transaction) => {
            const contractRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clientContracts/${idClientContract}`)
            transaction.update(contractRef, {
                status: CLIENT_CONTRACT_STATUS.ACTIVE,
                'suspension.isSuspended': false,
                updatedAt: normalizeDate(new Date())
            })

            const clientRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/clients/${contract.idClient}`)
            transaction.update(clientRef, {
                status: CLIENT_STATUS.ACTIVE,
                updatedAt: normalizeDate(new Date())
            })

            DashboardSummaryService.applyInTransaction(transaction, idTenant, idBranch, {
                activeclients: 1,
                suspendedclients: -1
            })
        })

        await ClientContractAuditLogger.logReactivation({
            idTenant, idBranch, userId, idClientContract
        })

        // Atualizar também o status das matrículas associadas
        try {
            const { getDocs, query, collection, where, updateDoc } = await import('firebase/firestore')
            const enrollmentsSnap = await getDocs(query(
                collection(db, `tenants/${idTenant}/branches/${idBranch}/enrollments`),
                where('idClientContract', '==', idClientContract),
                where('status', '==', CLIENT_STATUS.SUSPENDED)
            ))
            for (const docSnap of enrollmentsSnap.docs) {
                await updateDoc(docSnap.ref, { status: CLIENT_STATUS.ACTIVE, updatedAt: normalizeDate(new Date()) })
            }
        } catch (err) {
            console.error("[ClientContractSuspensionService] Erro ao reativar matrículas:", err)
        }

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, contract.idClient)

        return true
    }
}
