import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { getFirebaseBackend } from '../../helpers/firebase_helper'
import { normalizeDate } from '../../utils/date'
import { DashboardAuditLogger } from './audit/DashboardAuditLogger'
import { DashboardRules } from './domain/DashboardRules'

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
     * Busca o summary de um mês específico.
     */
    async getMonthSummary(idTenant, idBranch, month) {
        const summaryRef = this.getMonthSummaryRef(idTenant, idBranch, month)
        const snapshot = await getDoc(summaryRef)
        return snapshot.exists() ? snapshot.data() : null
    },

    /**
     * Cache de promessas pendentes para evitar multiplas chamadas paralelas ao mesmo documento.
     */
    _pendingRequests: {},

    /**
     * Busca o summary atual.
     */
    async getCurrent(idTenant, idBranch) {
        const key = `${idTenant}-${idBranch}`;
        if (this._pendingRequests[key]) return this._pendingRequests[key];

        const fetch = async () => {
            try {
                const summaryRef = this.getSummaryRef(idTenant, idBranch)
                const snapshot = await getDoc(summaryRef)

                if (!snapshot.exists()) {
                    // Inicializa se não existir
                    await this.initialize(idTenant, idBranch)
                    // Recarrega apos inicializar
                    const newSnapshot = await getDoc(summaryRef)
                    return newSnapshot.data()
                }

                return snapshot.data()
            } finally {
                // Remove do cache ao finalizar (seja sucesso ou erro)
                delete this._pendingRequests[key];
            }
        };

        this._pendingRequests[key] = fetch();
        return this._pendingRequests[key];
    },

    /**
     * Inicializa o documento summary com zeros.
     */
    async initialize(idTenant, idBranch) {
        const summaryRef = this.getSummaryRef(idTenant, idBranch)
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const initialData = {
            // Funil de Conversão
            leads: 0,
            trialsScheduled: 0,
            trialsAttended: 0,
            converted: 0,

            // Base Atual
            activeclients: 0,
            suspendedclients: 0,
            canceledclients: 0,

            // Novos (Mês Atual)
            newLeads: 0,
            newclients: 0,
            renewals: 0,
            winbacks: 0,

            // Taxas (calculadas)
            conversionRate: 0,
            trialShowUpRate: 0,
            trialConversionRate: 0,

            // Metadata
            lastUpdated: normalizeDate(new Date()),
            month: currentMonth
        }

        await setDoc(summaryRef, initialData)

        // Log básico de inicialização (pode ser userId nulo se for via sistema)
        await DashboardAuditLogger.logSummaryUpdated(idTenant, idBranch, null, currentMonth, { action: 'initialized' });

        return initialData
    },

    /**
     * Incrementa/Decrementa campos do summary.
     * Uso: increment({ activeclients: 1, suspendedclients: -1 })
     */
    async update(idTenant, idBranch, updates, userId = null) {
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

        // Auditoria
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await DashboardAuditLogger.logSummaryUpdated(idTenant, idBranch, userId, monthKey, updates);
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
    async recalculate(idTenant, idBranch, userId = null) {
        const { clientRepository } = await import('../../data/repositories/ClientRepository')
        const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository')

        // Conta clientes reais (Leads são apenas aqueles sem NENHUM histórico de contrato)
        const allClients = await clientRepository.findAll(idTenant, idBranch)

        const leads = allClients.filter(c => {
            const hasContractHistory = !!(c.computed?.activeContractId || c.computed?.contractEndDate)
            return (c.lifecycleStatus === 'lead' || !c.lifecycleStatus) && !hasContractHistory
        }).length

        const trialsScheduled = allClients.filter(c => c.lifecycle?.trial?.scheduled).length
        const trialsAttended = allClients.filter(c => c.lifecycle?.trial?.attended).length

        // Conta contratos reais (estritamente ativos e não vencidos)
        const activeContracts = await clientContractRepository.findStrictlyActive(idTenant, idBranch)
        const suspendedContracts = await clientContractRepository.findByStatus(idTenant, idBranch, 'suspended')

        // Novos do mês
        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newLeads = allClients.filter(c => normalizeDate(c.createdAt) >= startMonth).length
        const newclients = allClients.filter(c =>
            c.lifecycle?.convertedAt && normalizeDate(c.lifecycle.convertedAt) >= startMonth
        ).length

        // Calcula taxas via Domínio
        const conversionRate = DashboardRules.calculateRate(activeContracts.length, leads)
        const trialShowUpRate = DashboardRules.calculateRate(trialsAttended, trialsScheduled)
        const trialConversionRate = DashboardRules.calculateRate(activeContracts.length, trialsAttended)

        const recalculatedData = {
            leads,
            trialsScheduled,
            trialsAttended,
            converted: activeContracts.length,
            activeclients: activeContracts.length,
            suspendedclients: suspendedContracts.length,
            newLeads,
            newclients,
            renewals: 0, // TODO: Implementar lógica de recálculo histórico
            winbacks: 0, // TODO: Implementar lógica de recálculo histórico
            conversionRate,
            trialShowUpRate,
            trialConversionRate,
            lastUpdated: normalizeDate(new Date()),
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }

        const summaryRef = this.getSummaryRef(idTenant, idBranch)
        await setDoc(summaryRef, recalculatedData)

        // Auditoria
        await DashboardAuditLogger.logSummaryRecalculated(idTenant, idBranch, userId, recalculatedData.month);

        return recalculatedData
    }
}
