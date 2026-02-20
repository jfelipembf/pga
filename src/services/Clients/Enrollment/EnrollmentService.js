import { enrollmentRepository } from '../../../data/repositories/EnrollmentRepository'
import { sessionRepository } from '../../../data/repositories/SessionRepository'
import { EnrollmentSchema, ENROLLMENT_TYPE, ENROLLMENT_STATUS } from '../../../data/schemas/Clients/EnrollmentSchema'
import { LIFECYCLE_STATUS } from '../../../utils/constants'
import { normalizeDate, getTodayStr, toISODate } from '../../../utils/date'
import { query, where, getDocs, orderBy, writeBatch, doc } from 'firebase/firestore'
import { ClientService } from '../ClientService'
import { ClientLifecycleService } from '../ClientLifecycleService'
import { ServiceContextHelper } from '../../Core/DataAggregationHelper'
import { EnrollmentRules } from './domain/EnrollmentRules'
import { EnrollmentAuditLogger } from './audit/EnrollmentAuditLogger'

/**
 * Helper interno para unificar a criação do documento de matrícula
 */
const buildEnrollmentPayload = ({
    idClient,
    idContract = null,
    idClass,
    clientData,
    classData,
    activityData,
    staffData,
    session,
    enrollmentType,
    startDate,
    endDate = null,
    totalSessions,
    userId
}) => {
    return {
        idClient,
        idContract,
        idClass,
        clientName: clientData.name,
        clientPhoto: clientData.photoUrl || null,
        className: classData?.name || session.className || null,
        activityName: activityData?.name || session.activityName || null,
        startTime: session.startTime || null,
        endTime: session.endTime || null,
        weekday: session.weekday || null,
        instructorName: staffData?.name || session.instructorName || session.employeeName || null,
        areaName: session.areaName || null,
        idActivity: session.idActivity || null,
        idStaff: session.idStaff || null,
        enrollmentType,
        status: ENROLLMENT_STATUS.ACTIVE,
        enrolledAt: normalizeDate(new Date()),
        startDate,
        endDate,
        totalSessions,
        attendedSessions: 0,
        missedSessions: 0,
        createdBy: userId,
        updatedBy: userId
    }
}

/**
 * Serviço para Gestão de Matrículas
 */
export const EnrollmentService = {
    /**
     * Matricula um aluno em uma ou mais turmas (sessões futuras)
     */
    enrollClient: async (idTenant, idBranch, user, enrollmentData) => {
        const { idClient, idContract, classIds, clientName } = enrollmentData
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        // Validação de Regras de Negócio
        EnrollmentRules.validateRegularEnrollment(idContract, classIds)

        const todayStr = getTodayStr()

        // 1. Otimização: Buscar todas as matrículas ativas do cliente UMA única vez
        const allActiveEnrollments = await enrollmentRepository.findActiveByClient(idTenant, idBranch, idClient)

        // 2. Processamento Sequencial por Turma para evitar complexidade excessiva no batch global
        const results = []

        for (const idClass of classIds) {
            // Verificar duplicidade localmente
            if (allActiveEnrollments.find(e => e.idClass === idClass)) {
                console.warn(`[EnrollmentService] Cliente já possui matrícula ativa na turma ${idClass}. Pulando...`)
                continue
            }

            // A. Buscar todas as sessões FUTURAS desta turma
            const sessionsCollectionRef = sessionRepository.getCollectionRef(idTenant, idBranch)
            const q = query(
                sessionsCollectionRef,
                where('idClass', '==', idClass),
                where('sessionDate', '>=', todayStr),
                orderBy('sessionDate', 'asc')
            )

            const sessionsSnapshot = await getDocs(q)
            const futureSessions = sessionsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(s => s.deleted !== true && s.deletedAt == null)

            if (futureSessions.length === 0) {
                console.warn(`[EnrollmentService] Nenhuma sessão futura encontrada para a turma ${idClass} `)
                continue
            }

            const firstSession = futureSessions[0]

            // B. Enriquecer dados usando o Helper de Contexto
            const [clientData, classContext] = await Promise.all([
                ServiceContextHelper.getClientContext(idTenant, idBranch, idClient),
                ServiceContextHelper.getClassContext(idTenant, idBranch, idClass)
            ])

            const classData = classContext?.class
            const activityData = classContext?.activity
            const staffData = classContext?.instructor

            const enrollmentDoc = buildEnrollmentPayload({
                idClient,
                idContract,
                idClass,
                clientData,
                classData,
                activityData,
                staffData,
                session: firstSession,
                enrollmentType: ENROLLMENT_TYPE.REGULAR,
                startDate: firstSession.sessionDate,
                totalSessions: futureSessions.length,
                userId
            })

            await EnrollmentSchema.validate(enrollmentDoc)

            // Criação da Matrícula Principal (Fora do Batch, para garantir ID)
            const newEnrollment = await enrollmentRepository.create(idTenant, idBranch, enrollmentDoc)
            results.push(newEnrollment)

            // C. Atualizar Sessões em Batches (Lote)
            // Cada sessão consome 2 operações (addClient + incrementCounter)
            // Limite seguro: 200 sessões por batch (400 operações)
            const db = enrollmentRepository.db;

            let batch = writeBatch(db);
            let operationCount = 0;

            // Adiciona contador da turma ao primeiro batch
            enrollmentRepository.incrementClassCounters(idTenant, idBranch, idClass, batch);
            operationCount++;

            for (const session of futureSessions) {
                if (session.enrolledCount >= (session.maxCapacity || 999)) continue;

                enrollmentRepository.addClientToSession(idTenant, idBranch, session.id, {
                    enrollmentId: newEnrollment.id,
                    idClient,
                    clientName: clientData.name,
                    enrollmentType: ENROLLMENT_TYPE.REGULAR,
                    attended: null,
                    createdBy: userId
                }, batch);

                enrollmentRepository.incrementSessionCounters(idTenant, idBranch, session.id, false, batch);

                operationCount += 2;

                if (operationCount >= 450) { // Safety margin
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                }
            }

            if (operationCount > 0) {
                await batch.commit();
            }

            // D. Auditoria
            await EnrollmentAuditLogger.logEnrollmentCreated({
                idTenant, idBranch, userId, userName,
                newEnrollment, clientName,
                classData, idClass
            })
        }

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, idClient)

        return results;
    },

    /**
     * Agenda uma aula experimental (1 sessão específica)
     */
    scheduleTrialClass: async (idTenant, idBranch, user, trialData) => {
        const { idClient, sessionId, clientName } = trialData
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const session = await sessionRepository.findById(idTenant, idBranch, sessionId)
        if (!session) throw new Error('Sessão não encontrada')

        const existingEnrollments = await enrollmentRepository.findByClient(idTenant, idBranch, idClient)

        // Validação de Regras de Negócio
        EnrollmentRules.validateTrialClass(session, existingEnrollments)

        // B. Enriquecer dados usando o Helper de Contexto
        const [clientData, classContext] = await Promise.all([
            ServiceContextHelper.getClientContext(idTenant, idBranch, idClient),
            ServiceContextHelper.getClassContext(idTenant, idBranch, session.idClass)
        ])

        const classData = classContext?.class
        const activityData = classContext?.activity
        const staffData = classContext?.instructor

        const enrollmentDoc = buildEnrollmentPayload({
            idClient,
            idContract: null,
            idClass: session.idClass,
            clientData,
            classData,
            activityData,
            staffData,
            session,
            enrollmentType: ENROLLMENT_TYPE.TRIAL,
            startDate: session.sessionDate,
            endDate: session.sessionDate,
            totalSessions: 1,
            userId
        })

        await EnrollmentSchema.validate(enrollmentDoc)
        const newEnrollment = await enrollmentRepository.create(idTenant, idBranch, enrollmentDoc)

        // Batch Update para Trial Class (Simples, mas robusto)
        const batch = writeBatch(enrollmentRepository.db);

        enrollmentRepository.addClientToSession(idTenant, idBranch, sessionId, {
            enrollmentId: newEnrollment.id,
            idClient,
            clientName: clientData.name,
            enrollmentType: ENROLLMENT_TYPE.TRIAL,
            attended: null,
            createdBy: userId
        }, batch);

        enrollmentRepository.incrementSessionCounters(idTenant, idBranch, sessionId, true, batch);
        enrollmentRepository.incrementClassCounters(idTenant, idBranch, session.idClass, batch);

        await batch.commit();

        await EnrollmentAuditLogger.logTrialScheduled({
            idTenant, idBranch, userId, userName,
            newEnrollment, clientName, sessionId
        })

        // Atualiza o Funil de Vendas do Cliente
        await ClientLifecycleService.updateStatus(idTenant, idBranch, idClient, LIFECYCLE_STATUS.SCHEDULED, {
            userId,
            reason: 'Aula experimental agendada',
            sessionId
        })

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, idClient)

        return newEnrollment
    },

    /**
     * Cancela uma matrícula e remove aluno de sessões futuras
     */
    cancelEnrollment: async (idTenant, idBranch, user, enrollmentId, reason, effectiveDate = null) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        // 1. Buscar detalhes da matrícula
        const enrollment = await enrollmentRepository.findById(idTenant, idBranch, enrollmentId)
        if (!enrollment) throw new Error('Matrícula não encontrada')

        const targetDate = effectiveDate ? toISODate(effectiveDate) : getTodayStr()
        const sessionsCollectionRef = sessionRepository.getCollectionRef(idTenant, idBranch)

        // 2. Buscar sessões
        let q;
        if (enrollment.enrollmentType === ENROLLMENT_TYPE.TRIAL) {
            q = query(
                sessionsCollectionRef,
                where('idClass', '==', enrollment.idClass),
                where('sessionDate', '==', enrollment.startDate)
            )
        } else {
            q = query(
                sessionsCollectionRef,
                where('idClass', '==', enrollment.idClass),
                where('sessionDate', '>=', targetDate)
            )
        }

        const sessionsSnapshot = await getDocs(q)
        const allFutureSessions = sessionsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(s => s.deleted !== true && s.deletedAt == null)

        // 3. Processar em Batch
        // Operações: Remove Client, Decr Session, Decr Class
        const db = enrollmentRepository.db;
        let batch = writeBatch(db);
        let operationCount = 0;

        // Atualizar matrícula (Cancelada) e Contador de Turma
        const enrollmentRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'enrollments', enrollmentId);
        batch.update(enrollmentRef, {
            status: ENROLLMENT_STATUS.CANCELLED,
            cancelReason: reason || '',
            cancelledAt: normalizeDate(new Date()),
            cancelledBy: userId
        });
        operationCount++;

        enrollmentRepository.decrementClassCounters(idTenant, idBranch, enrollment.idClass, batch);
        operationCount++;

        for (const session of allFutureSessions) {
            enrollmentRepository.removeClientFromSession(idTenant, idBranch, session.id, enrollmentId, batch);
            enrollmentRepository.decrementSessionCounters(idTenant, idBranch, session.id, enrollment.enrollmentType === ENROLLMENT_TYPE.TRIAL, batch);
            operationCount += 2;

            if (operationCount >= 450) {
                await batch.commit();
                batch = writeBatch(db);
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        await EnrollmentAuditLogger.logEnrollmentCancelled({
            idTenant, idBranch, userId, userName,
            enrollmentId,
            clientName: enrollment.clientName,
            affectedSessionsCount: allFutureSessions.length
        })

        // Sincroniza campos computados do cliente
        ClientService.syncComputedFields(idTenant, idBranch, enrollment.idClient)

        return { enrollmentId, affectedSessions: allFutureSessions.length }
    },

    /**
     * Lista matrículas de um cliente
     */
    listClientEnrollments: async (idTenant, idBranch, idClient) => {
        return await enrollmentRepository.findByClient(idTenant, idBranch, idClient)
    },

    /**
     * Obtém estatísticas de uma matrícula
     */
    getEnrollmentStats: async (idTenant, idBranch, enrollmentId) => {
        const enrollment = await enrollmentRepository.findById(idTenant, idBranch, enrollmentId)
        if (!enrollment) throw new Error('Matrícula não encontrada')

        return {
            totalSessions: enrollment.totalSessions,
            attendedSessions: enrollment.attendedSessions,
            missedSessions: enrollment.missedSessions,
            attendanceRate: enrollment.totalSessions > 0
                ? ((enrollment.attendedSessions / enrollment.totalSessions) * 100).toFixed(1)
                : 0
        }
    },

    /**
     * Conta matrículas ativas em uma turma
     */
    countActiveByClass: async (idTenant, idBranch, idClass) => {
        const enrollments = await enrollmentRepository.findByClass(idTenant, idBranch, idClass)
        return enrollments.length
    }
}
