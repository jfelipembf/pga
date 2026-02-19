import { enrollmentRepository } from "../../data/repositories/EnrollmentRepository"
import { clientRepository } from "../../data/repositories/ClientRepository"
import { classRepository } from "../../data/repositories/ClassRepository"
import { query, where, getDocs, getDoc, doc } from "firebase/firestore"

/**
 * Serviço para Gestão de Aulas Experimentais e Conversão
 */
export const TrialService = {
    /**
     * Lista aulas experimentais com filtros e enriquecimento
     */
    listTrials: async (idTenant, idBranch, filters = {}) => {
        const { startDate, endDate, idStaff, idActivity, search } = filters

        // 1. Buscar matrículas do tipo TRIAL
        const enrollmentRef = enrollmentRepository.getCollectionRef(idTenant, idBranch)
        let q = query(
            enrollmentRef,
            where("enrollmentType", "==", "trial")
        )

        const snapshot = await getDocs(q)
        let allTrials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        // Filtro básico de deleção (in-memory para compatibilidade)
        const trials = allTrials.filter(d =>
            (d.deletedAt === null || d.deletedAt === undefined) &&
            d.deleted !== true &&
            d.status !== 'deleted'
        )

        // 2. Buscar dados únicos de Clientes e Turmas (para enriquecimento)
        const clientIds = [...new Set(trials.map(t => t.idClient))].filter(Boolean)
        const classIds = [...new Set(trials.map(t => t.idClass))].filter(Boolean)

        const [clientsList, classesList] = await Promise.all([
            Promise.all(clientIds.map(id => clientRepository.findById(idTenant, idBranch, id))),
            Promise.all(classIds.map(async (id) => {
                try {
                    // Usamos getDoc direto para não filtrar classes deletadas (útil para histórico)
                    const classRef = doc(classRepository.getCollectionRef(idTenant, idBranch), id)
                    const snap = await getDoc(classRef)
                    return snap.exists() ? { id: snap.id, ...snap.data() } : null
                } catch (e) { return null }
            }))
        ])

        const clientsMap = clientsList.reduce((acc, c) => { if (c && c.id) acc[c.id] = c; return acc }, {})
        const classesMap = classesList.reduce((acc, c) => { if (c && c.id) acc[c.id] = c; return acc }, {})

        // 3. Enriquecer e Filtrar
        let results = trials.map(t => {
            const client = clientsMap[t.idClient] || {}
            const classData = classesMap[t.idClass] || {}

            return {
                ...t,
                // Garantir IDs se estiverem faltando no doc da matrícula (legacy)
                idActivity: t.idActivity || classData.idActivity || null,
                idStaff: t.idStaff || classData.idStaff || null,
                origin: client.leadSource || 'Não informado',
                lifecycleStatus: client.lifecycleStatus || 'lead',
                isConverted: client.lifecycleStatus === 'active'
            }
        })

        // Filtros em memória
        if (startDate) {
            results = results.filter(t => t.startDate >= startDate)
        }
        if (endDate) {
            results = results.filter(t => t.startDate <= endDate)
        }
        if (idStaff) {
            results = results.filter(t => t.idStaff === idStaff)
        }
        if (idActivity) {
            results = results.filter(t => t.idActivity === idActivity)
        }
        if (search) {
            const s = search.toLowerCase()
            results = results.filter(t =>
                t.clientName?.toLowerCase().includes(s)
            )
        }

        // Ordenar por data e hora decrescente
        return results.sort((a, b) => b.startDate.localeCompare(a.startDate) || b.startTime?.localeCompare(a.startTime))
    },

    /**
     * Calcula os KPIs de Conversão baseados na lista filtrada
     */
    calculateKPIs: (trials) => {
        const total = trials.length

        // Presenças: totalSessions > 0 e attendedSessions > 0 (ou status do ciclo de vida)
        // Nota: Na matrícula trial, totalSessions costuma ser 1.
        const attended = trials.filter(t => t.attendedSessions > 0 || t.status === 'completed' || t.lifecycleStatus === 'attended' || t.lifecycleStatus === 'active').length

        // Vendas: Alunos que viraram ativos
        const converted = trials.filter(t => t.isConverted).length

        const attendanceRate = total > 0 ? (attended / total) * 100 : 0
        const conversionRate = attended > 0 ? (converted / attended) * 100 : 0

        return {
            totalScheduled: total,
            totalAttended: attended,
            totalConverted: converted,
            attendanceRate: attendanceRate.toFixed(1),
            conversionRate: conversionRate.toFixed(1)
        }
    }
}
