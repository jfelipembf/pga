import { sessionRepository } from '../../data/repositories/SessionRepository'
import { SessionAuditLogger } from './audit/SessionAuditLogger'
import {
    serverTimestamp,
    collection,
    doc,
    getDocs,
    setDoc,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore'
import { SessionFactory } from './SessionFactory'
import { SessionMapper } from './SessionMapper'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { getFirebaseBackend } from '../../helpers/firebase_helper'
import { PlanningLogic } from '../Methodology/PlanningLogic';
import { SessionRules } from './domain/SessionRules';

const getDb = () => getFirebaseBackend().db;

/**
 * Serviço para Gestão de Sessões (Aulas Individuais)
 */
export const SessionService = {
    /**
     * Lista sessões por intervalo de data
     */
    listByDateRange: async (idTenant, idBranch, startDate, endDate) => {
        const raw = await sessionRepository.findByDateRange(idTenant, idBranch, startDate, endDate)
        return SessionMapper.toUIList(raw)
    },

    /**
     * Lista os alunos matriculados na turma dessa sessão
     */
    getclientsForClass: async (idTenant, idBranch, idClass) => {
        return await enrollmentRepository.findByClass(idTenant, idBranch, idClass)
    },

    /**
     * Lista todas as sessões ativas
     */
    listActive: async (idTenant, idBranch) => {
        const raw = await sessionRepository.findActive(idTenant, idBranch)
        return SessionMapper.toUIList(raw)
    },

    /**
     * Lista sessões de uma turma específica
     */
    listByClass: async (idTenant, idBranch, idClass) => {
        const raw = await sessionRepository.findByClass(idTenant, idBranch, idClass)
        return SessionMapper.toUIList(raw)
    },

    /**
     * Busca uma sessão por ID
     */
    getById: async (idTenant, idBranch, idSession) => {
        return await sessionRepository.findById(idTenant, idBranch, idSession)
    },

    /**
     * Atualiza dados de uma sessão específica
     */
    update: async (idTenant, idBranch, user, idSession, data) => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const updatePayload = SessionRules.buildUpdatePayload(userId, data)
        const result = await sessionRepository.update(idTenant, idBranch, idSession, updatePayload)

        await SessionAuditLogger.logUpdate({
            idTenant, idBranch, userId, userName,
            idSession,
            data
        })

        return result
    },

    /**
     * Cancela uma sessão específica (Ex: Feriado)
     */
    cancelSession: async (idTenant, idBranch, user, idSession, reason = '') => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const cancelPayload = SessionRules.buildCancelPayload(userId, reason)
        const result = await sessionRepository.update(idTenant, idBranch, idSession, cancelPayload)

        await SessionAuditLogger.logCancel({
            idTenant, idBranch, userId, userName,
            idSession,
            reason
        })

        return result
    },

    /**
     * Cria uma sessão extra fora da grade regular
     */
    createExtraSession: async (idTenant, idBranch, user, sessionData) => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const finalData = SessionFactory.create(
            idTenant, idBranch, userId,
            sessionData, sessionData.sessionDate,
            { isExtra: true }
        )

        const result = await sessionRepository.create(idTenant, idBranch, finalData)

        await SessionAuditLogger.logExtraSessionCreation({
            idTenant, idBranch, userId, userName,
            idSession: result.id,
            sessionDate: sessionData.sessionDate,
            sessionData
        })

        return result
    },

    // =========================================================================
    // PLANEJAMENTO (Subcoleção / Methodology)
    // =========================================================================

    /**
     * Busca o planejamento ativo de uma sessão
     */
    getPlanning: async (idTenant, idBranch, idSession) => {
        try {
            const db = getDb();
            const planningRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${idSession}/planning`);
            const q = query(planningRef, orderBy('createdAt', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return null;
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        } catch (error) {
            console.error("[SessionService] Erro ao buscar planejamento:", error);
            return null;
        }
    },

    /**
     * Salva um novo planejamento para a sessão
     */
    savePlanning: async (idTenant, idBranch, user, idSession, planningData) => {
        try {
            const userId = user?.uid || user || 'system'
            const userName = user?.displayName || user?.email || 'Sistema'

            const db = getDb();
            const planningCol = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${idSession}/planning`);
            const newDocRef = doc(planningCol);

            const payload = SessionRules.buildPlanningPayload(userId, planningData)

            await setDoc(newDocRef, payload);

            await SessionAuditLogger.logPlanningSave({
                idTenant, idBranch, userId, userName,
                idSession,
                planningData
            })

            return { id: newDocRef.id, ...planningData };
        } catch (error) {
            console.error("[SessionService] Erro ao salvar planejamento:", error);
            throw error;
        }
    },

    /**
     * Busca planejamento ativo para a turma na semana.
     */
    findPlanningForWeek: async (idTenant, idBranch, classId, weekStart, weekEnd) => {
        try {
            const db = getDb();
            const sessionsRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions`);
            const qSession = query(
                sessionsRef,
                where('idClass', '==', classId),
                where('sessionDate', '>=', weekStart),
                where('sessionDate', '<=', weekEnd)
            );

            const sessionSnap = await getDocs(qSession);
            if (sessionSnap.empty) return null;

            const sortedSessions = sessionSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

            for (const session of sortedSessions) {
                const planningRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${session.id}/planning`);
                const qPlan = query(planningRef, where('isWeeklyFocus', '==', true), limit(1));
                const planSnap = await getDocs(qPlan);

                if (!planSnap.empty) {
                    return { sessionId: session.id, sessionDate: session.sessionDate, ...planSnap.docs[0].data() };
                }
            }

            return null;
        } catch (error) {
            console.error("[SessionService] Erro ao buscar planejamento semanal:", error);
            return null;
        }
    },

    /**
     * Gera planejamentos futuros em lote com rotação inteligente (Sequence Planning).
     */
    generateFuturePlannings: async (idTenant, idBranch, user, classId, startDateString, objectivesData) => {
        try {
            const userId = user?.uid || user || 'system'
            const userName = user?.displayName || user?.email || 'Sistema'

            const db = getDb();
            const sessionsRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions`);
            const qFuture = query(
                sessionsRef,
                where('idClass', '==', classId),
                where('sessionDate', '>', startDateString),
                orderBy('sessionDate', 'asc')
            );

            const futureSnap = await getDocs(qFuture);
            if (futureSnap.empty) return;

            const sessions = futureSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const firstSessionDate = new Date(startDateString);

            // 1. Gerar Sequência de Metodologia
            const weeksCount = SessionRules.calculatePlanningWeeksCount(startDateString, sessions[sessions.length - 1].sessionDate);
            const planSequence = PlanningLogic.generateFutureSequence(objectivesData, weeksCount);

            if (!planSequence || planSequence.length === 0) return;

            // 2. Iterar e Salvar (Batch-like)
            const batchPromises = [];
            let currentWeekState = { weekStart: null, focusSessionId: null };

            for (const session of sessions) {
                const planData = SessionRules.calculateAutoPlanning(userId, session, firstSessionDate, planSequence, currentWeekState);

                if (planData) {
                    const planningCol = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${session.id}/planning`);
                    batchPromises.push(setDoc(doc(planningCol), planData));
                }
            }

            await Promise.all(batchPromises);

            await SessionAuditLogger.logFuturePlanningGeneration({
                idTenant, idBranch, userId, userName,
                classId,
                sessionCount: batchPromises.length
            })

            console.log(`[Methodology] Planejamento progressivo gerado para ${batchPromises.length} sessões.`);

        } catch (error) {
            console.error("[SessionService] Erro ao gerar planejamentos futuros:", error);
        }
    }
}
