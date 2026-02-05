import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { getFirebaseBackend } from '../../helpers/firebase_helper'
import moment from 'moment'
import { normalizeDate } from '../../utils/date'

/**
 * Serviço para gerenciar o documento agregado de Dashboard.
 * Usa documento único para economizar leituras do Firestore.
 */
export const DashboardSummaryService = {

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
     * Retorna a referência do documento summary atual.
     */
    getSummaryRef(idTenant, idBranch) {
        return doc(this.db, `tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`)
    },

    /**
     * Retorna a referência do documento summary de um mês específico.
     */
    getMonthSummaryRef(idTenant, idBranch, month) {
        return doc(this.db, `tenants/${idTenant}/branches/${idBranch}/dashboardSummary/${month}`)
    },

    /**
     * Busca o summary atual.
     */
    async getCurrent(idTenant, idBranch) {
        const summaryRef = this.getSummaryRef(idTenant, idBranch)
        const snapshot = await getDoc(summaryRef)

        if (!snapshot.exists()) {
            // Inicializa se não existir
            await this.initialize(idTenant, idBranch)
            return await this.getCurrent(idTenant, idBranch)
        }

        return snapshot.data()
    },

    /**
     * Inicializa o documento summary com zeros.
     */
    async initialize(idTenant, idBranch) {
        const summaryRef = this.getSummaryRef(idTenant, idBranch)
        const currentMonth = moment().format('YYYY-MM')

        const initialData = {
            // Funil de Conversão
            leads: 0,
            trialsScheduled: 0,
            trialsAttended: 0,
            converted: 0,

            // Base Atual
            activeStudents: 0,
            suspendedStudents: 0,
            canceledStudents: 0,

            // Novos (Mês Atual)
            newLeads: 0,
            newStudents: 0,

            // Taxas (calculadas)
            conversionRate: 0,
            trialShowUpRate: 0,
            trialConversionRate: 0,

            // Metadata
            lastUpdated: normalizeDate(new Date()),
            month: currentMonth
        }

        await setDoc(summaryRef, initialData)
        return initialData
    },

    /**
     * Incrementa/Decrementa campos do summary.
     * Uso: increment({ activeStudents: 1, suspendedStudents: -1 })
     */
    async update(idTenant, idBranch, updates) {
        const summaryRef = this.getSummaryRef(idTenant, idBranch)

        // Converte valores para increment()
        const incrementUpdates = {}
        for (const [key, value] of Object.entries(updates)) {
            incrementUpdates[key] = increment(value)
        }

        incrementUpdates.lastUpdated = normalizeDate(new Date())

        try {
            await updateDoc(summaryRef, incrementUpdates)
        } catch (error) {
            // Se o documento não existir, inicializa
            if (error.code === 'not-found') {
                await this.initialize(idTenant, idBranch)
                await updateDoc(summaryRef, incrementUpdates)
            } else {
                throw error
            }
        }
    },

    /**
     * Usa runTransaction para garantir atomicidade com outras operações.
     * Exemplo: Atualizar contrato + summary juntos.
     */
    applyInTransaction(transaction, idTenant, idBranch, updates) {
        const summaryRef = this.getSummaryRef(idTenant, idBranch)

        const incrementUpdates = {}
        for (const [key, value] of Object.entries(updates)) {
            incrementUpdates[key] = increment(value)
        }

        incrementUpdates.lastUpdated = normalizeDate(new Date())

        transaction.update(summaryRef, incrementUpdates)
    },

    /**
     * Recalcula o summary do zero (para reconciliação semanal).
     * Esta função é cara, deve rodar apenas via Cloud Function agendada.
     */
    async recalculate(idTenant, idBranch) {
        const { clientRepository } = await import('../../data/repositories/ClientRepository')
        const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository')

        // Conta clientes reais
        const allClients = await clientRepository.findAll(idTenant, idBranch)
        const leads = allClients.filter(c => c.lifecycleStatus === 'lead').length
        const trialsScheduled = allClients.filter(c => c.lifecycle?.trial?.scheduled).length
        const trialsAttended = allClients.filter(c => c.lifecycle?.trial?.attended).length

        // Conta contratos reais (estritamente ativos e não vencidos)
        const activeContracts = await clientContractRepository.findStrictlyActive(idTenant, idBranch)
        const suspendedContracts = await clientContractRepository.findByStatus(idTenant, idBranch, 'suspended')

        // Novos do mês
        const startMonth = normalizeDate(moment().startOf('month'));
        const newLeads = allClients.filter(c => normalizeDate(c.createdAt) >= startMonth).length
        const newStudents = allClients.filter(c =>
            c.lifecycle?.convertedAt && normalizeDate(c.lifecycle.convertedAt) >= startMonth
        ).length

        // Calcula taxas
        const conversionRate = leads > 0 ? (activeContracts.length / leads) : 0
        const trialShowUpRate = trialsScheduled > 0 ? (trialsAttended / trialsScheduled) : 0
        const trialConversionRate = trialsAttended > 0 ? (activeContracts.length / trialsAttended) : 0

        const recalculatedData = {
            leads,
            trialsScheduled,
            trialsAttended,
            converted: activeContracts.length,
            activeStudents: activeContracts.length,
            suspendedStudents: suspendedContracts.length,
            newLeads,
            newStudents,
            conversionRate,
            trialShowUpRate,
            trialConversionRate,
            lastUpdated: normalizeDate(new Date()),
            month: moment().format('YYYY-MM')
        }

        const summaryRef = this.getSummaryRef(idTenant, idBranch)
        await setDoc(summaryRef, recalculatedData)

        return recalculatedData
    }
}
