import moment from 'moment'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { sessionRepository } from '../../data/repositories/SessionRepository'
import { EnrollmentSchema, ENROLLMENT_TYPE } from '../../data/schemas/Clients/EnrollmentSchema'
import { AuditService } from '../Core/AuditService'
import { normalizeDate } from '../../utils/date'
import { query, where, getDocs, orderBy, writeBatch, doc } from 'firebase/firestore'
import { ClientService } from './ClientService'
import { ServiceContextHelper } from '../Core/DataAggregationHelper'

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

        if (!idContract) {
            throw new Error('Cliente deve ter um contrato ativo para realizar matrícula')
        }

        if (!classIds || classIds.length === 0) {
            throw new Error('Selecione ao menos uma turma para matrícula')
        }

        const todayStr = moment().format('YYYY-MM-DD')

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

            const enrollmentDoc = {
                idClient,
                idContract,
                idClass,
                clientName: clientData?.name || clientName || "Cliente",
                friendlyId: clientData?.friendlyId || null,
                idGym: clientData?.friendlyId || null,
                className: classData?.name || firstSession.className || null,
                activityName: activityData?.name || firstSession.activityName || null,
                startTime: firstSession.startTime || null,
                endTime: firstSession.endTime || null,
                weekday: firstSession.weekday || null,
                instructorName: staffData?.name || firstSession.instructorName || firstSession.employeeName || null,
                areaName: firstSession.areaName || null,
                idActivity: firstSession.idActivity || null,
                idStaff: firstSession.idStaff || null,
                enrollmentType: ENROLLMENT_TYPE.REGULAR,
                status: 'active',
                enrolledAt: normalizeDate(new Date()),
                startDate: firstSession.sessionDate,
                endDate: null,
                totalSessions: futureSessions.length,
                attendedSessions: 0,
                missedSessions: 0,
                createdBy: userId,
                updatedBy: userId
            }

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
                    clientName,
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
            AuditService.log({
                idTenant, idBranch, userId, userName,
                action: 'ENROLLMENT_CREATED',
                entityType: 'enrollment',
                entityId: newEnrollment.id,
                description: `${clientName} matriculado(a) na turma ${classData?.name || idClass} `
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

        if (moment(session.sessionDate).isBefore(moment(), 'day')) {
            throw new Error('Não é possível agendar experimental em sessões passadas')
        }

        if (session.enrolledCount >= (session.maxCapacity || 999)) {
            throw new Error('Sessão já está com capacidade máxima')
        }

        const existingEnrollments = await enrollmentRepository.findByClient(idTenant, idBranch, idClient)
        if (existingEnrollments.some(e => e.enrollmentType === ENROLLMENT_TYPE.TRIAL && e.idClass === session.idClass && e.status === 'active')) {
            throw new Error('Cliente já possui uma aula experimental agendada para esta atividade')
        }

        // B. Enriquecer dados usando o Helper de Contexto
        const [clientData, classContext] = await Promise.all([
            ServiceContextHelper.getClientContext(idTenant, idBranch, idClient),
            ServiceContextHelper.getClassContext(idTenant, idBranch, session.idClass)
        ])

        const classData = classContext?.class
        const activityData = classContext?.activity
        const staffData = classContext?.instructor

        const enrollmentDoc = {
            idClient,
            idContract: null,
            idClass: session.idClass,
            clientName: clientData?.name || clientName || 'Cliente',
            friendlyId: clientData?.friendlyId || null,
            idGym: clientData?.friendlyId || null,
            className: classData?.name || session.className || null,
            activityName: activityData?.name || session.activityName || null,
            startTime: session.startTime || null,
            endTime: session.endTime || null,
            weekday: session.weekday || null,
            instructorName: staffData?.name || session.instructorName || session.employeeName || null,
            areaName: session.areaName || null,
            idActivity: session.idActivity || null,
            idStaff: session.idStaff || null,
            enrollmentType: ENROLLMENT_TYPE.TRIAL,
            status: 'active',
            enrolledAt: normalizeDate(new Date()),
            startDate: session.sessionDate,
            endDate: session.sessionDate,
            totalSessions: 1,
            attendedSessions: 0,
            missedSessions: 0,
            createdBy: userId,
            updatedBy: userId
        }

        await EnrollmentSchema.validate(enrollmentDoc)
        const newEnrollment = await enrollmentRepository.create(idTenant, idBranch, enrollmentDoc)

        // Batch Update para Trial Class (Simples, mas robusto)
        const batch = writeBatch(enrollmentRepository.db);

        enrollmentRepository.addClientToSession(idTenant, idBranch, sessionId, {
            enrollmentId: newEnrollment.id,
            idClient,
            clientName,
            enrollmentType: ENROLLMENT_TYPE.TRIAL,
            attended: null,
            createdBy: userId
        }, batch);

        enrollmentRepository.incrementSessionCounters(idTenant, idBranch, sessionId, true, batch);
        enrollmentRepository.incrementClassCounters(idTenant, idBranch, session.idClass, batch);

        await batch.commit();

        AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'TRIAL_SCHEDULED',
            entityType: 'enrollment',
            entityId: newEnrollment.id,
            description: `Aula experimental agendada para ${clientName} na sessão ${sessionId} `
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

        const targetDate = effectiveDate ? moment(effectiveDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
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
            status: 'cancelled',
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

        AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'ENROLLMENT_CANCELLED',
            entityType: 'enrollment',
            entityId: enrollmentId,
            description: `Matrícula de ${enrollment.clientName} cancelada em ${allFutureSessions.length} sessões.`
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
