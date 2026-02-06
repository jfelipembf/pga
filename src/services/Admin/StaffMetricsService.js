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

        console.group(`[StaffMetrics] Iniciando análise para o professor: ${idStaff}`)
        console.log(`Período de referência: ${currentMonth.format('MMMM YYYY')}`)

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
                studentsChange: current.summary.activeRegularStudents - previous.summary.activeRegularStudents,
                retentionChange: current.metrics.retentionRate - previous.metrics.retentionRate,
                trialConversionChange: current.metrics.trialConversionRate - previous.metrics.trialConversionRate
            }
        }

        console.log("Resultado Final das Métricas:", result)
        console.groupEnd()

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
            // Como as matrículas não têm idStaff, buscamos as matrículas ativas da unidade e filtramos em memória
            // Isso é necessário porque o Firestore não permite comparar arrays grandes no 'in'
            const qEnroll = query(
                enrollmentsRef,
                where('deletedAt', '==', null)
            )
            const enrollSnapshot = await getDocs(qEnroll)
            allEnrollments = enrollSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(e => classIds.includes(e.idClass))
        }

        // A. Base Ativa no Período
        const activeAtEnd = allEnrollments.filter(e => {
            if (e.status === 'active') return true
            // Se cancelado após o fim do período, ainda era ativo no período
            const cancelDate = e.cancelledAt?.toDate ? moment(e.cancelledAt.toDate()) : (e.cancelledAt ? moment(e.cancelledAt) : null)
            if (cancelDate && cancelDate.isAfter(end)) return true
            return false
        })

        const regularAtEnd = activeAtEnd.filter(e => e.enrollmentType === 'regular')
        const trialAtEnd = activeAtEnd.filter(e => e.enrollmentType === 'trial')

        // B. Novos Alunos no Mês
        const newEnrollments = allEnrollments.filter(e => {
            if (e.enrollmentType !== 'regular') return false
            const enrolledDate = e.enrolledAt?.toDate ? moment(e.enrolledAt.toDate()) : moment(e.enrolledAt)
            return enrolledDate.isBetween(start, end, null, '[]')
        })

        // C. Cancelamentos no Mês
        const cancellations = allEnrollments.filter(e => {
            if (e.status !== 'cancelled') return false
            const cancelDate = e.cancelledAt?.toDate ? moment(e.cancelledAt.toDate()) : moment(e.cancelledAt)
            return cancelDate.isBetween(start, end, null, '[]')
        })

        // D. Cálculo de Taxas
        const occupancyRate = totalCapacity > 0 ? (totalEnrolledCount / totalCapacity) * 100 : 0
        const attendanceRate = totalEnrolledCount > 0 ? (totalAttended / totalEnrolledCount) * 100 : 0

        const studentsEnd = regularAtEnd.length
        const studentsNew = newEnrollments.length
        const studentsStart = studentsEnd - studentsNew + cancellations.length
        const retentionRate = studentsStart > 0 ? ((studentsEnd - studentsNew) / studentsStart) * 100 : 100

        return {
            summary: {
                totalSessions: sessions.length,
                sessionsWithAttendance,
                totalEnrolled: totalEnrolledCount,
                totalCapacity,
                activeRegularStudents: regularAtEnd.length,
                activeTrialStudents: trialAtEnd.length,
                newStudents: newEnrollments.length,
                cancelledStudents: cancellations.length
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
