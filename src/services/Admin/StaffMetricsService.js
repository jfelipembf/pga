import { collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseBackend } from '../../helpers/firebase_helper'
import moment from 'moment'

/**
 * Serviço para cálculo de métricas de desempenho de colaboradores (professores)
 * Baseado na grade real (sessões) e detalhes de retenção da base.
 */
export const StaffMetricsService = {
    get db() {
        const backend = getFirebaseBackend()
        return backend.db
    },

    /**
     * Calcula as métricas de um colaborador para um determinado mês, compara com o anterior
     * e retorna o histórico dos últimos 6 meses para gráficos de evolução.
     */
    getStaffMonthlyMetrics: async (idTenant, idBranch, idStaff, date = new Date()) => {
        const currentMonth = moment(date)

        // Criar array de datas para os últimos 6 meses
        const months = []
        for (let i = 5; i >= 0; i--) {
            months.push(moment(date).subtract(i, 'month'))
        }

        // Buscar métricas de todos os meses em paralelo
        const historyResults = await Promise.all(
            months.map(m => StaffMetricsService.calculateMetricsForPeriod(idTenant, idBranch, idStaff, m.toDate()))
        )

        const current = historyResults[5] // Mês atual (ou selecionado)
        const previous = historyResults[4] // Mês anterior

        const result = {
            period: currentMonth.format('MMMM YYYY'),
            current,
            previous,
            history: months.map((m, idx) => ({
                month: m.format('MMM'),
                ...historyResults[idx].metrics
            })),
            comparatives: {
                occupancyChange: current.metrics.occupancyRate - previous.metrics.occupancyRate,
                attendanceChange: current.metrics.attendanceRate - previous.metrics.attendanceRate,
                clientsChange: current.summary.activeRegularclients - previous.summary.activeRegularclients,
                retentionChange: current.metrics.retentionRate - previous.metrics.retentionRate,
                trialConversionChange: current.metrics.trialConversionRate - previous.metrics.trialConversionRate
            }
        }

        return result
    },

    /**
     * Auxiliar para calcular métricas de um único período
     */
    calculateMetricsForPeriod: async (idTenant, idBranch, idStaff, date) => {
        const start = moment(date).startOf('month')
        const end = moment(date).endOf('month')
        const startStr = start.format('YYYY-MM-DD')
        const endStr = end.format('YYYY-MM-DD')

        const db = StaffMetricsService.db

        // --- 1. BUSCAR TURMAS DO PROFESSOR (CONCEITO BASE) ---
        const classesRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/classes`)
        const qClasses = query(
            classesRef,
            where('idStaff', '==', idStaff),
            where('deletedAt', '==', null)
        )
        const classesSnapshot = await getDocs(qClasses)
        const myClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const classIds = myClasses.map(c => c.id)

        // --- 2. SESSÕES (GRADE REAL NA AGENDA) ---
        const sessionsRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions`)
        const qSessions = query(
            sessionsRef,
            where('idStaff', '==', idStaff),
            where('sessionDate', '>=', startStr),
            where('sessionDate', '<=', endStr),
            where('deletedAt', '==', null)
        )
        const sessionsSnapshot = await getDocs(qSessions)
        const sessions = sessionsSnapshot.docs.map(doc => doc.data())

        let totalCapacity = 0
        let totalEnrolledCount = 0
        let totalAttended = 0
        let sessionsWithAttendance = 0

        sessions.forEach(s => {
            totalCapacity += parseInt(s.maxCapacity) || 0
            totalEnrolledCount += parseInt(s.enrolledCount) || 0
            totalAttended += parseInt(s.presentCount) || 0
            if (s.attendanceRecorded) sessionsWithAttendance++
        })

        // --- 3. MATRÍCULAS (ANÁLISE DE BASE E RETENÇÃO) ---
        let allEnrollments = []
        if (classIds.length > 0) {
            const enrollmentsRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/enrollments`)
            const qEnroll = query(
                enrollmentsRef,
                where('deletedAt', '==', null)
            )
            const enrollSnapshot = await getDocs(qEnroll)
            allEnrollments = enrollSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(e => classIds.includes(e.idClass))
        }

        const activeAtEnd = allEnrollments.filter(e => {
            if (e.status === 'active') return true
            const cancelDate = e.cancelledAt?.toDate ? moment(e.cancelledAt.toDate()) : (e.cancelledAt ? moment(e.cancelledAt) : null)
            if (cancelDate && cancelDate.isAfter(end)) return true
            return false
        })

        const regularAtEnd = activeAtEnd.filter(e => e.enrollmentType === 'regular')
        const trialAtEnd = activeAtEnd.filter(e => e.enrollmentType === 'trial')

        const newEnrollments = allEnrollments.filter(e => {
            if (e.enrollmentType !== 'regular') return false
            const enrolledDate = e.enrolledAt?.toDate ? moment(e.enrolledAt.toDate()) : moment(e.enrolledAt)
            return enrolledDate.isBetween(start, end, null, '[]')
        })

        const cancellations = allEnrollments.filter(e => {
            if (e.status !== 'cancelled') return false
            const cancelDate = e.cancelledAt?.toDate ? moment(e.cancelledAt.toDate()) : moment(e.cancelledAt)
            return cancelDate.isBetween(start, end, null, '[]')
        })

        const occupancyRate = totalCapacity > 0 ? (totalEnrolledCount / totalCapacity) * 100 : 0
        const attendanceRate = totalEnrolledCount > 0 ? (totalAttended / totalEnrolledCount) * 100 : 0

        const clientsEnd = regularAtEnd.length
        const clientsNew = newEnrollments.length
        const clientsStart = clientsEnd - clientsNew + cancellations.length
        const retentionRate = clientsStart > 0 ? ((clientsEnd - clientsNew) / clientsStart) * 100 : 100

        return {
            summary: {
                totalSessions: sessions.length,
                sessionsWithAttendance,
                totalEnrolled: totalEnrolledCount,
                totalCapacity,
                activeRegularclients: regularAtEnd.length,
                activeTrialclients: trialAtEnd.length,
                newclients: newEnrollments.length,
                cancelledclients: cancellations.length
            },
            metrics: {
                occupancyRate: Math.round(occupancyRate),
                attendanceRate: Math.round(attendanceRate),
                retentionRate: Math.round(retentionRate),
                trialConversionRate: 0,
                trialCount: trialAtEnd.length
            }
        }
    }
}
