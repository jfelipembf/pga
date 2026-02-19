import { sessionRepository } from '../../data/repositories/SessionRepository'
import { AuditService } from '../Core/AuditService'
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
import { startOfWeek, format, differenceInCalendarWeeks } from 'date-fns';

const getDb = () => getFirebaseBackend().db;

/**
 * Serviço para Gestão de Sessões (Aulas Individuais)
 * 
 * Responsabilidades:
 * - CRUD de sessões individuais
 * - Consultas por período, turma, etc
 * - Atualização de status e cancelamentos eventuais
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
    getStudentsForClass: async (idTenant, idBranch, idClass) => {
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

        const updateData = {
            ...data,
            updatedBy: userId,
            updatedAt: serverTimestamp()
        }

        const result = await sessionRepository.update(idTenant, idBranch, idSession, updateData)

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_UPDATED',
            entityType: 'session',
            entityId: idSession,
            description: `Sessão ${idSession} alterada manualmente.`,
            details: { changes: data }
        })

        return result
    },

    /**
     * Cancela uma sessão específica (Ex: Feriado ou falta do professor)
     */
    cancelSession: async (idTenant, idBranch, user, idSession, reason = '') => {
        const userId = user?.uid || 'system'
        const userName = user?.displayName || user?.email || 'Sistema'

        const result = await sessionRepository.update(idTenant, idBranch, idSession, {
            status: 'canceled', // Padronizado com ClassService (um 'L')
            canceledAt: serverTimestamp(),
            canceledBy: userId,
            cancellationReason: reason,
            updatedBy: userId,
            updatedAt: serverTimestamp()
        })

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CANCELED',
            entityType: 'session',
            entityId: idSession,
            description: `Aula cancelada individualmente: ${reason || 'Sem motivo informado'}`,
            details: { reason }
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

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'SESSION_CREATED',
            entityType: 'session',
            entityId: result.id,
            description: `Sessão avulsa/extra criada para o dia ${sessionData.sessionDate}`,
            details: sessionData
        })

        return result
    },

    // =========================================================================
    // PLANEJAMENTO (Subcoleção)
    // =========================================================================

    /**
     * Busca o planejamento ativo de uma sessão
     */
    getPlanning: async (idTenant, idBranch, idSession) => {
        try {
            const db = getDb();
            const planningRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${idSession}/planning`);
            // Busca o mais recente
            const q = query(planningRef, orderBy('createdAt', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return null;
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        } catch (error) {
            console.error("Erro ao buscar planejamento:", error);
            return null;
        }
    },

    /**
     * Salva um novo planejamento para a sessão (cria novo documento no histórico)
     */
    savePlanning: async (idTenant, idBranch, userId, idSession, planningData) => {
        try {
            const db = getDb();
            const planningCollection = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${idSession}/planning`);
            // Gera referência para novo documento
            const newDocRef = doc(planningCollection);

            const payload = {
                ...planningData,
                status: 'active',
                createdAt: serverTimestamp(),
                createdBy: userId
            };

            await setDoc(newDocRef, payload);
            return { id: newDocRef.id, ...planningData }; // Retornando data sem serverTimestamp para UI imediata
        } catch (error) {
            console.error("Erro ao salvar planejamento:", error);
            throw error;
        }
    },

    /**
     * Busca se existe ALGUM planejamento já definido para a turma nesta semana.
     * Retorna o primeiro que encontrar com 'isWeeklyFocus: true'.
     */
    findPlanningForWeek: async (idTenant, idBranch, classId, weekStart, weekEnd) => {
        try {
            const db = getDb();
            // 1. Encontrar sessões da turma na semana
            const sessionsRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions`);
            const qSession = query(
                sessionsRef,
                where('idClass', '==', classId),
                where('sessionDate', '>=', weekStart),
                where('sessionDate', '<=', weekEnd)
            );

            const sessionSnap = await getDocs(qSession);
            if (sessionSnap.empty) return null;

            // 2. Para cada sessão, verificar se tem planejamento focado na semana
            // (Idealmente verificaríamos em ordem cronológica)
            const sortedSessions = sessionSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

            for (const session of sortedSessions) {
                const planningRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${session.id}/planning`);
                // Precisamos de um planejamento que seja 'isWeeklyFocus'
                const qPlan = query(planningRef, where('isWeeklyFocus', '==', true), limit(1));
                const planSnap = await getDocs(qPlan);

                if (!planSnap.empty) {
                    const planData = planSnap.docs[0].data();
                    return {
                        sessionId: session.id,
                        sessionDate: session.sessionDate,
                        ...planData
                    };
                }
            }

            return null;
        } catch (error) {
            console.error("Erro ao buscar planejamento semanal existente:", error);
            return null; // Falhar silenciosamente permitindo gerar novo
        }
    },
    /**
     * Gera planejamentos futuros em lote para todas as sessões seguintes da turma.
     * Implementa rotação inteligente de objetivos (Sequence Planning).
     */
    generateFuturePlannings: async (idTenant, idBranch, userId, classId, startDateString, objectivesData) => {
        try {
            const db = getDb();
            // 1. Buscar sessões futuras
            const sessionsRef = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions`);
            const qFuture = query(
                sessionsRef,
                where('idClass', '==', classId),
                where('sessionDate', '>', startDateString),
                orderBy('sessionDate', 'asc')
            );

            const futureSnap = await getDocs(qFuture);
            if (futureSnap.empty) return;

            // 2. Gerar Sequência de Planejamento (Planejamento Progressivo)
            const sessions = futureSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Determinar range de semanas
            const firstSessionDate = new Date(startDateString);
            const lastSessionDate = new Date(sessions[sessions.length - 1].sessionDate);

            // Adicionar margem de segurança no cálculo de semanas
            const weeksCount = Math.abs(differenceInCalendarWeeks(lastSessionDate, firstSessionDate)) + 4;

            // Gerar a sequência lógica de objetivos (rotacionando fundamentais e secundários)
            const planSequence = PlanningLogic.generateFutureSequence(objectivesData, weeksCount);

            if (!planSequence || planSequence.length === 0) return;

            // 3. Iterar e salvar
            const batchPromises = [];
            let currentWeekStart = null;
            let weeklyFocusId = null;

            for (const session of sessions) {
                const dateObj = new Date(session.sessionDate + 'T12:00:00');

                // Identificar semana da sessão para pegar o conjunto correto da sequência
                // Usamos a diferença em semanas para saber o índice
                // Se o índice estourar o tamanho da sequência, usamos operador módulo (%) para rotacionar
                const weekIndex = Math.abs(differenceInCalendarWeeks(dateObj, firstSessionDate));
                const safeSequenceIndex = weekIndex % planSequence.length;
                const weekObjectives = planSequence[safeSequenceIndex] || [];

                // --- Lógica de Foco Semanal vs Herança ---
                const weekStart = format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                let isFocus = false;
                let inheritedFrom = null;

                if (weekStart !== currentWeekStart) {
                    // Nova semana -> Define novo foco (com base na sequência)
                    currentWeekStart = weekStart;
                    isFocus = true;
                    weeklyFocusId = session.id;
                } else {
                    // Mesma semana -> Herda (replica objetivo da semana para consistência diária)
                    isFocus = false;
                    inheritedFrom = weeklyFocusId;
                }

                if (weekObjectives.length === 0) continue;

                // Preparar dados
                const planData = {
                    objectives: weekObjectives,
                    weekId: `${format(dateObj, 'yyyy')}-W${format(dateObj, 'w')}`,
                    isWeeklyFocus: isFocus,
                    inheritedFromSessionId: inheritedFrom,
                    status: 'active',
                    autoGenerated: true,
                    createdAt: serverTimestamp(),
                    createdBy: userId || 'system',
                    weekSequenceIndex: weekIndex // Metadado útil para debug
                };

                // Adicionar promise de salvamento
                const planningCol = collection(db, `tenants/${idTenant}/branches/${idBranch}/sessions/${session.id}/planning`);
                const newDocRef = doc(planningCol);

                batchPromises.push(setDoc(newDocRef, planData));
            }

            // Otimização: Executar em blocos se for muito grande
            // (Promise.all aguenta bem ~100 requests, mas batch seria melhor se implementado aqui também)
            await Promise.all(batchPromises);
            console.log(`Planejamento progressivo futuro gerado para ${batchPromises.length} sessões.`);

        } catch (error) {
            console.error("Erro ao gerar planejamentos futuros:", error);
        }
    }
}
