import { sessionRepository } from '../../data/repositories/SessionRepository'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { AuditService } from '../Core/AuditService'
import { writeBatch, doc, serverTimestamp, increment } from 'firebase/firestore'
// Import Client and Automation Services
import { ClientService } from '../Clients/ClientService'
import { automationService } from '../Automation/AutomationService'
import { formatDate } from '../../utils/date'

/**
 * Serviço de Controle de Presença (Attendance)
 * 
 * Responsabilidades:
 * - Registrar presença/ausência de alunos em sessões
 * - Atualizar contadores de frequência nas matrículas
 * - Fornecer métricas de frequência por aluno
 * 
 * Fluxo de Dados:
 * 1. Modal de Presença chama `recordAttendance()` com a lista de alunos e seus status
 * 2. O serviço salva o snapshot na sessão
 * 3. Para cada aluno COM matrícula válida, atualiza os contadores (attendedSessions/missedSessions)
 * 4. Registra log de auditoria
 */
export const AttendanceService = {
    /**
     * Registra a presença de uma sessão
     * 
     * LÓGICA DIFERENCIAL:
     * - Se é a primeira chamada: incrementa contadores normalmente
     * - Se é edição: compara status anterior vs novo e ajusta contadores
     * 
     * @param {string} idTenant - ID do tenant
     * @param {string} idBranch - ID da filial
     * @param {object} user - Usuário logado { uid, displayName, email }
     * @param {string} idSession - ID da sessão
     * @param {object} attendanceData - Dados da chamada
     * @param {array} attendanceData.clients - Lista de alunos com { id, enrollmentId, name, status }
     */
    recordAttendance: async (idTenant, idBranch, user, idSession, attendanceData) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        if (!idSession) {
            throw new Error('ID da sessão é obrigatório')
        }

        if (!attendanceData?.clients || attendanceData.clients.length === 0) {
            throw new Error('Lista de alunos é obrigatória')
        }

        // 1. Buscar snapshot anterior para lógica diferencial
        const currentSession = await sessionRepository.findById(idTenant, idBranch, idSession)
        const previousSnapshot = currentSession?.attendanceSnapshot || []

        // Criar mapa: enrollmentId -> status anterior
        const previousStatusMap = new Map()
        previousSnapshot.forEach(client => {
            if (client.enrollmentId) {
                previousStatusMap.set(client.enrollmentId, client.status)
            }
        })

        const isFirstAttendance = previousSnapshot.length === 0

        // 2. Preparar Batch Atômico
        const db = sessionRepository.db
        const mainBatch = writeBatch(db)

        // 3. Calcular estatísticas e Preparar Update da Sessão
        const presentList = attendanceData.clients.filter(c => c.status !== 'absent')
        const absentList = attendanceData.clients.filter(c => c.status === 'absent')

        const sessionRef = doc(sessionRepository.getCollectionRef(idTenant, idBranch), idSession)
        mainBatch.update(sessionRef, {
            attendanceRecorded: true,
            attendanceSnapshot: attendanceData.clients,
            presentCount: presentList.length,
            absentCount: absentList.length,
            attendanceRecordedAt: serverTimestamp(),
            attendanceRecordedBy: userId,
            updatedAt: serverTimestamp()
        })

        // 4. Preparar Atualizações das Matrículas no Batch
        let enrollmentsUpdated = 0

        attendanceData.clients.forEach((client) => {
            if (!client.enrollmentId) return

            const newStatus = client.status
            const oldStatus = previousStatusMap.get(client.enrollmentId)

            if (oldStatus === newStatus) return

            const enrollmentRef = doc(enrollmentRepository.getCollectionRef(idTenant, idBranch), client.enrollmentId)
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

            mainBatch.update(enrollmentRef, updates)
            enrollmentsUpdated++
        })

        // 5. Automação e CRM para Aulas Experimentais (Fora do Batch pois é evento externo)
        const experimentalClients = attendanceData.clients.filter(
            c => c.tag === "Extra" || c.enrollmentType === 'trial' || c.enrollmentType === 'experimental' || c.type === 'experimental' || (c.tag && c.tag.includes('EX'))
        )

        if (experimentalClients.length > 0) {
            // Disparar em paralelo sem travar o batch
            const { ClientLifecycleService } = await import('../Clients/ClientLifecycleService')
            const { LIFECYCLE_STATUS } = await import('../../utils/constants')

            experimentalClients.forEach(async (client) => {
                try {
                    const idClient = client.idClient || client.id
                    const fullClient = await ClientService.getClientById(idTenant, idBranch, idClient)

                    if (fullClient && fullClient.lifecycleStatus !== LIFECYCLE_STATUS.CONVERTED) {

                        // Faltou na experimental
                        if (client.status === 'absent') {
                            await ClientLifecycleService.updateStatus(idTenant, idBranch, idClient, LIFECYCLE_STATUS.WAITING, {
                                userId, reason: `Faltou na aula experimental da sessão ${idSession}`
                            })

                            const phone = fullClient?.mobile || fullClient?.phone || fullClient?.cellPhone || fullClient?.responsavelPhone
                            if (phone) {
                                automationService.emit(idTenant, 'EXPERIMENTAL_ABSENCE', {
                                    client: fullClient.name,
                                    name: fullClient.name,
                                    phone: phone,
                                    date: formatDate(new Date())
                                })
                            }

                            // Veio na experimental
                        } else if (client.status === 'present') {
                            await ClientLifecycleService.updateStatus(idTenant, idBranch, idClient, LIFECYCLE_STATUS.ATTENDED, {
                                userId, reason: `Concluiu a aula experimental da sessão ${idSession}`
                            })
                        }
                    }
                } catch (autoErr) {
                    console.error("[CRM/Automation] Erro ao atualizar funil da aula experimental:", autoErr)
                }
            })
        }

        // 6. Execução Atômica
        await mainBatch.commit()

        // 5. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: isFirstAttendance ? 'ATTENDANCE_RECORDED' : 'ATTENDANCE_UPDATED',
            entityType: 'session',
            entityId: idSession,
            description: `Chamada ${isFirstAttendance ? 'registrada' : 'atualizada'}: ${presentList.length} presentes, ${absentList.length} ausentes`,
            details: {
                presentCount: presentList.length,
                absentCount: absentList.length,
                totalClients: attendanceData.clients.length,
                enrollmentsUpdated,
                isEdit: !isFirstAttendance
            }
        })

        return {
            success: true,
            idSession,
            presentCount: presentList.length,
            absentCount: absentList.length,
            enrollmentsUpdated,
            isEdit: !isFirstAttendance
        }
    },

    /**
     * Obtém métricas de frequência de um aluno baseado em suas matrículas
     * 
     * @param {string} idTenant - ID do tenant
     * @param {string} idBranch - ID da filial
     * @param {string} idClient - ID do cliente
     * @returns {object} Métricas consolidadas de frequência
     */
    getClientAttendanceMetrics: async (idTenant, idBranch, idClient) => {
        // Buscar todas as matrículas do cliente
        const enrollments = await enrollmentRepository.findByClient(idTenant, idBranch, idClient)

        // Filtrar apenas matrículas ativas/suspensas para métricas
        const activeEnrollments = enrollments.filter(e =>
            ['active', 'suspended'].includes(e.status)
        )

        // Consolidar estatísticas
        let totalAttended = 0
        let totalMissed = 0

        activeEnrollments.forEach(enrollment => {
            totalAttended += enrollment.attendedSessions || 0
            totalMissed += enrollment.missedSessions || 0
        })

        const totalSessions = totalAttended + totalMissed
        const frequencyRate = totalSessions > 0 ? (totalAttended / totalSessions) * 100 : 0

        // Cálculo de Risco de Evasão (inverso da frequência)
        const riskScore = totalSessions > 0 ? (100 - frequencyRate) : 0
        let riskLevel = 'Baixo'
        if (riskScore >= 70) riskLevel = 'Alto'
        else if (riskScore >= 30) riskLevel = 'Médio'

        return {
            totalSessions,
            attended: totalAttended,
            missed: totalMissed,
            frequencyRate: Math.round(frequencyRate * 10) / 10, // 1 casa decimal
            riskScore: Math.round(riskScore * 10) / 10,
            riskLevel,
            enrollmentsCount: activeEnrollments.length
        }
    },

    /**
     * Lista os alunos matriculados em uma turma para a chamada
     * Retorna dados enriquecidos prontos para o modal de presença
     * 
     * @param {string} idTenant - ID do tenant
     * @param {string} idBranch - ID da filial
     * @param {string} idClass - ID da turma
     * @param {string|Date} referenceDate - Data de referência da sessão (opcional)
     * @returns {array} Lista de alunos com dados para chamada
     */
    getclientsForAttendance: async (idTenant, idBranch, idClass, referenceDate = null) => {
        // Buscar matrículas ativas na turma
        const enrollments = await enrollmentRepository.findByClass(idTenant, idBranch, idClass)

        // Se houver data de referência, filtrar matrículas que não estavam ativas na época
        const validEnrollments = referenceDate
            ? enrollments.filter(e => {
                if (!e.startDate) return true;

                // Resolve Data Inicio (Timestamp/Date/String)
                let startVal = e.startDate;
                if (startVal && typeof startVal.toDate === 'function') startVal = startVal.toDate(); // Firestore Timestamp
                const startStr = startVal instanceof Date
                    ? startVal.toISOString().split('T')[0]
                    : String(startVal).split('T')[0];

                // Resolve Data Referencia
                let refVal = referenceDate;
                if (refVal && typeof refVal.toDate === 'function') refVal = refVal.toDate();
                const refStr = refVal instanceof Date
                    ? refVal.toISOString().split('T')[0]
                    : String(refVal).split('T')[0];

                return startStr <= refStr;
            })
            : enrollments;

        // Mapear para formato do modal de presença
        return validEnrollments.map(enrollment => ({
            ...enrollment, // Herda todos os campos originais
            id: enrollment.idClient,
            idClient: enrollment.idClient,
            enrollmentId: enrollment.id, // CRÍTICO: ID da matrícula para atualização
            name: enrollment.clientName || enrollment.clientName,
            status: 'present', // Default para presença na chamada (status de execução)
            justification: '',
            tag: 'Matriculado',
            enrollmentType: enrollment.enrollmentType || 'regular',
            // Dados extras para exibição
            attendedSessions: enrollment.attendedSessions || 0,
            missedSessions: enrollment.missedSessions || 0,
            clientStatus: enrollment.status || 'active', // Status do contrato/matrícula
            friendlyId: enrollment.friendlyId || null,
            idGym: enrollment.friendlyId || null
        }))
    },

    /**
     * Recupera o histórico de presença de uma sessão específica
     * 
     * @param {string} idTenant - ID do tenant
     * @param {string} idBranch - ID da filial
     * @param {string} idSession - ID da sessão
     * @returns {object|null} Dados de presença ou null se não registrado
     */
    getSessionAttendance: async (idTenant, idBranch, idSession) => {
        const session = await sessionRepository.findById(idTenant, idBranch, idSession)

        if (!session || !session.attendanceRecorded) {
            return null
        }

        return {
            recorded: true,
            recordedAt: session.attendanceRecordedAt,
            recordedBy: session.attendanceRecordedBy,
            presentCount: session.presentCount || 0,
            absentCount: session.absentCount || 0,
            clients: session.attendanceSnapshot || []
        }
    }
}
