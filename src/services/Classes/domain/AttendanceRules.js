import { serverTimestamp, increment } from 'firebase/firestore'

/**
 * Regras de Domínio para Frequência / Chamadas (Attendance)
 */
export const AttendanceRules = {
    /**
     * Valida os dados de entrada
     * @param {string} idSession
     * @param {object} attendanceData
     */
    validateForRegistration: (idSession, attendanceData) => {
        if (!idSession) {
            throw new Error('ID da sessão é obrigatório')
        }

        if (!attendanceData?.clients || attendanceData.clients.length === 0) {
            throw new Error('Lista de alunos é obrigatória')
        }
        return true;
    },

    /**
     * Compara o snapshot anterior com a edição atual para mapear quais clientes precisam atualizar contadores de matrícula
     */
    buildPreviousStatusMap: (previousSnapshot) => {
        const previousStatusMap = new Map()
        if (Array.isArray(previousSnapshot)) {
            previousSnapshot.forEach(client => {
                if (client.enrollmentId) {
                    previousStatusMap.set(client.enrollmentId, client.status)
                }
            })
        }
        return previousStatusMap
    },

    /**
     * Constrói o objeto de atualização da Sessão
     */
    buildSessionUpdatePayload: (attendanceDataClients, presentList, absentList, userId) => {
        return {
            attendanceRecorded: true,
            attendanceSnapshot: attendanceDataClients,
            presentCount: presentList.length,
            absentCount: absentList.length,
            attendanceRecordedAt: serverTimestamp(),
            attendanceRecordedBy: userId,
            updatedAt: serverTimestamp()
        }
    },

    /**
     * Constrói o payload para atualização de matrícula de acordo com a mudança de status
     * @param {string} oldStatus 
     * @param {string} newStatus 
     * @param {string} idSession 
     * @param {string} userId 
     * @returns {object|null} Payload do delta para atualizar na matrícula ou null se não for necessário
     */
    buildEnrollmentDeltaPayload: (oldStatus, newStatus, idSession, userId, sessionDate) => {
        if (oldStatus === newStatus) return null;

        const updates = {
            lastAttendanceDate: serverTimestamp(),
            lastAttendanceSessionId: idSession,
            updatedAt: serverTimestamp(),
            updatedBy: userId
        }

        let attendedDelta = 0
        let missedDelta = 0

        // REVERTER contagem do status antigo (se existia)
        if (oldStatus === 'present' || (oldStatus && oldStatus !== 'absent')) {
            attendedDelta -= 1
        } else if (oldStatus === 'absent') {
            missedDelta -= 1
        }

        // INCREMENTAR contagem do status novo
        if (newStatus === 'absent') {
            missedDelta += 1
        } else {
            attendedDelta += 1
        }

        if (attendedDelta !== 0) updates.attendedSessions = increment(attendedDelta)
        if (missedDelta !== 0) updates.missedSessions = increment(missedDelta)

        // Novo: Estatísticas Mensais para Gráficos de Tendência
        if (sessionDate) {
            const yearMonth = sessionDate.substring(0, 7); // Ex: "2026-02"
            if (attendedDelta !== 0) updates[`statsByMonth.${yearMonth}.a`] = increment(attendedDelta);
            if (missedDelta !== 0) updates[`statsByMonth.${yearMonth}.m`] = increment(missedDelta);
        }

        return updates;
    },

    /**
     * Obtém da lista de chamada os alunos em aula experimental
     * @param {Array} clients 
     */
    getExperimentalClients: (clients) => {
        return clients.filter(
            c => c.tag === "Extra" || c.enrollmentType === 'trial' || c.enrollmentType === 'experimental' || c.type === 'experimental' || (c.tag && c.tag.includes('EX'))
        )
    },

    /**
     * Calcula as métricas de frequência a partir das matrículas de um cliente (risk score, frequencyRate, monthly trend)
     * @param {Array} enrollments Matrículas completas do cliente
     * @returns {object} Métricas aglomeradas
     */
    calculateClientAttendanceStats: (enrollments) => {
        let totalAttended = 0
        let totalMissed = 0
        const monthlyAggregation = {}
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        enrollments.forEach(enrollment => {
            // Totais acumulados
            totalAttended += enrollment.attendedSessions || 0
            totalMissed += enrollment.missedSessions || 0

            // Agregação Mensal
            if (enrollment.statsByMonth) {
                Object.entries(enrollment.statsByMonth).forEach(([month, values]) => {
                    if (!monthlyAggregation[month]) {
                        monthlyAggregation[month] = { a: 0, m: 0 }
                    }
                    monthlyAggregation[month].a += values.a || 0
                    monthlyAggregation[month].m += values.m || 0
                })
            }
        })

        const totalSessions = totalAttended + totalMissed
        const frequencyRate = totalSessions > 0 ? (totalAttended / totalSessions) * 100 : 0

        // Cálculo de Risco de Evasão (inverso da frequência)
        const riskScore = totalSessions > 0 ? (100 - frequencyRate) : 0
        let riskLevel = 'Baixo'
        if (riskScore >= 70) riskLevel = 'Alto'
        else if (riskScore >= 30) riskLevel = 'Médio'

        // Preparar Tendência Mensal (Últimos 6 meses)
        const sortedMonths = Object.keys(monthlyAggregation).sort().slice(-6)
        const monthlyData = {
            categories: sortedMonths.map(m => {
                const [y, mm] = m.split('-')
                return `${monthNames[parseInt(mm) - 1]}/${y.substring(2)}`
            }),
            attended: sortedMonths.map(m => monthlyAggregation[m].a),
            missed: sortedMonths.map(m => monthlyAggregation[m].m)
        }

        return {
            totalSessions,
            attended: totalAttended,
            missed: totalMissed,
            frequencyRate: Math.round(frequencyRate * 10) / 10,
            riskScore: Math.round(riskScore * 10) / 10,
            riskLevel,
            riskColor: riskScore < 30 ? '#4CAF50' : riskScore < 70 ? '#FF9800' : '#F44336',
            enrollmentsCount: enrollments.length,
            monthlyData
        }
    },

    /**
     * Regra para construir os dados das matrículas na obtenção para o modal de presença
     */
    filterValidEnrollmentsByReferenceDate: (enrollments, referenceDateStr) => {
        if (!referenceDateStr) return enrollments;

        return enrollments.filter(e => {
            if (!e.startDate) return true;

            // Resolve Data Inicio (Timestamp/Date/String)
            let startVal = e.startDate;
            if (startVal && typeof startVal.toDate === 'function') startVal = startVal.toDate(); // Firestore Timestamp
            const startStr = startVal instanceof Date
                ? startVal.toISOString().split('T')[0]
                : String(startVal).split('T')[0];

            return startStr <= referenceDateStr;
        })
    },

    /**
     * Mapeia uma matrícula para o formato esperado pelo modal de chamada (UI)
     */
    buildAttendanceClientPayload: (enrollment) => {
        return {
            id: enrollment.idClient,
            idClient: enrollment.idClient,
            enrollmentId: enrollment.id,

            // Dados para UI
            name: enrollment.clientName,
            photo: enrollment.clientPhoto || null,
            friendlyId: enrollment.friendlyId || null,

            // Estado inicial da chamada
            status: 'present',
            justification: '',

            // Classificadores
            tag: enrollment.tag || 'Matriculado',
            enrollmentType: enrollment.enrollmentType || 'regular',
            clientStatus: enrollment.status || 'active',

            // Contadores
            attendedSessions: enrollment.attendedSessions || 0,
            missedSessions: enrollment.missedSessions || 0,
        }
    },

    /**
     * Prepara o Snapshot de presença para SALVAMENTO no Firestore.
     */
    buildAttendanceSnapshotForStorage: (clients) => {
        return clients.map(client => ({
            idClient: client.idClient,
            enrollmentId: client.enrollmentId,
            status: client.status,
            justification: client.justification,
            tag: client.tag
        }));
    },

    /**
     * Formata a resposta do histórico de presença de uma sessão
     */
    buildSessionAttendanceResponse: (session) => {
        if (!session || !session.attendanceRecorded) return null;

        return {
            recorded: true,
            recordedAt: session.attendanceRecordedAt,
            recordedBy: session.attendanceRecordedBy,
            presentCount: session.presentCount,
            absentCount: session.absentCount,
            clients: session.attendanceSnapshot.map(snap => ({
                id: snap.idClient,
                idClient: snap.idClient,
                enrollmentId: snap.enrollmentId,
                status: snap.status,
                justification: snap.justification,
                tag: snap.tag
            }))
        }
    },

    /**
     * Determina a transição de ciclo de vida para um aluno em aula experimental
     * @param {object} client Registro resumido do aluno na chamada (id, status)
     * @param {object} fullClient Registro completo do aluno no banco (lifecycleStatus)
     * @param {string} idSession ID da sessão para o motivo
     * @returns {object|null} { nextStatus, reason } ou null se não houver mudança
     */
    determineLifecycleTransition: (client, fullClient, idSession) => {
        if (!fullClient || fullClient.lifecycleStatus === 'converted') return null;

        // Se o aluno faltou na aula experimental
        if (client.status === 'absent') {
            if (fullClient.lifecycleStatus === 'waiting') return null;
            return {
                nextStatus: 'waiting',
                reason: `Faltou na aula experimental da sessão ${idSession}`
            };
        }

        // Se o aluno compareceu à aula experimental
        if (client.status === 'present') {
            if (fullClient.lifecycleStatus === 'attended') return null;
            return {
                nextStatus: 'attended',
                reason: `Concluiu a aula experimental da sessão ${idSession}`
            };
        }

        return null;
    }
}
