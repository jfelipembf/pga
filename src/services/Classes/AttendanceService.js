import { sessionRepository } from '../../data/repositories/SessionRepository'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { writeBatch, doc } from 'firebase/firestore'
// Import Client and Automation Services
import { ClientService } from '../Clients/ClientService'
import { automationService } from '../Automation/AutomationService'
import { formatDate } from '../../utils/date'
import { AttendanceRules } from './domain/AttendanceRules'
import { AttendanceAuditLogger } from './audit/AttendanceAuditLogger'

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

        // 1. Validar e Formatar Regras
        AttendanceRules.validateForRegistration(idSession, attendanceData);

        // 2. Buscar snapshot anterior para lógica diferencial
        const currentSession = await sessionRepository.findById(idTenant, idBranch, idSession)
        const previousSnapshot = currentSession?.attendanceSnapshot || []

        // Criar mapa: enrollmentId -> status anterior via Rules
        const previousStatusMap = AttendanceRules.buildPreviousStatusMap(previousSnapshot);
        const isFirstAttendance = previousSnapshot.length === 0

        // 3. Preparar Batch Atômico
        const db = sessionRepository.db
        const mainBatch = writeBatch(db)

        // Calcular estatísticas e Preparar Update da Sessão via Rules
        const presentList = attendanceData.clients.filter(c => c.status !== 'absent')
        const absentList = attendanceData.clients.filter(c => c.status === 'absent')

        // NOVO: Gerar snapshot enxuto para o Firestore
        const storageSnapshot = AttendanceRules.buildAttendanceSnapshotForStorage(attendanceData.clients);
        const sessionUpdatePayload = AttendanceRules.buildSessionUpdatePayload(storageSnapshot, presentList, absentList, userId);

        const sessionRef = doc(sessionRepository.getCollectionRef(idTenant, idBranch), idSession)
        mainBatch.update(sessionRef, sessionUpdatePayload)

        // 4. Preparar Atualizações das Matrículas no Batch
        let enrollmentsUpdated = 0

        attendanceData.clients.forEach((client) => {
            if (!client.enrollmentId) return

            const newStatus = client.status
            const oldStatus = previousStatusMap.get(client.enrollmentId)

            const enrollmentDeltaPayload = AttendanceRules.buildEnrollmentDeltaPayload(oldStatus, newStatus, idSession, userId, currentSession?.sessionDate);

            if (enrollmentDeltaPayload) {
                const enrollmentRef = doc(enrollmentRepository.getCollectionRef(idTenant, idBranch), client.enrollmentId)
                mainBatch.update(enrollmentRef, enrollmentDeltaPayload)
                enrollmentsUpdated++
            }
        })

        // 5. Automação e CRM para Aulas Experimentais (Fora do Batch pois é evento externo) via Rules
        const experimentalClients = AttendanceRules.getExperimentalClients(attendanceData.clients);

        if (experimentalClients.length > 0) {
            // Disparar em paralelo sem travar o batch
            const { ClientLifecycleService } = await import('../Clients/ClientLifecycleService')

            experimentalClients.forEach(async (client) => {
                try {
                    const idClient = client.idClient || client.id
                    const fullClient = await ClientService.getClientById(idTenant, idBranch, idClient)

                    const transition = AttendanceRules.determineLifecycleTransition(client, fullClient, idSession);

                    if (transition) {
                        await ClientLifecycleService.updateStatus(idTenant, idBranch, idClient, transition.nextStatus, {
                            userId, reason: transition.reason
                        })
                    }

                    // Automação específica de ausência
                    if (client.status === 'absent') {
                        const phone = fullClient?.mobile || fullClient?.phone || fullClient?.cellPhone || fullClient?.responsavelPhone
                        if (phone) {
                            automationService.emit(idTenant, 'EXPERIMENTAL_ABSENCE', {
                                client: fullClient.name,
                                name: fullClient.name,
                                phone: phone,
                                date: formatDate(new Date())
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

        // 7. Auditoria (Facade Layer)
        await AttendanceAuditLogger.logAttendanceRecord(
            idTenant, idBranch, userId, userName, idSession, isFirstAttendance,
            presentList.length, absentList.length, attendanceData.clients.length, enrollmentsUpdated
        )

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

        // Consolidar estatísticas via Rules
        return AttendanceRules.calculateClientAttendanceStats(activeEnrollments);
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

        // Prepara data de referência
        let refStr = null;
        if (referenceDate) {
            let refVal = referenceDate;
            if (refVal && typeof refVal.toDate === 'function') refVal = refVal.toDate();
            refStr = refVal instanceof Date
                ? refVal.toISOString().split('T')[0]
                : String(refVal).split('T')[0];
        }

        // Filtrar validade via Rules
        const validEnrollments = AttendanceRules.filterValidEnrollmentsByReferenceDate(enrollments, refStr);

        // Mapear para formato do modal de presença via Rules
        return validEnrollments.map(enrollment => AttendanceRules.buildAttendanceClientPayload(enrollment));
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

        // Formata resposta via Rules
        return AttendanceRules.buildSessionAttendanceResponse(session);
    }
}
