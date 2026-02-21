import { useState, useEffect, useCallback } from 'react';
import { SessionService } from '../../../../services/Classes/SessionService';
import { startOfWeek, endOfWeek, format, isAfter } from 'date-fns';
import { useAuth } from '../../../../hooks/useAuth';
import { PlanningLogic } from '../../../../services/Methodology/PlanningLogic';
import { EvaluationService } from '../../../../services/Evaluations/EvaluationService';

export const useSessionPlanning = ({
    idTenant,
    idBranch,
    sessionId,
    classId,
    sessionDate,
    objectivesData,
    loadingAnalysis,
    analyzedAt,
    refreshAnalysis
}) => {
    const { user } = useAuth();
    const [planning, setPlanning] = useState(null);
    const [loadingPlanning, setLoadingPlanning] = useState(false);
    const [weekStatus, setWeekStatus] = useState(null);
    const [lastRefreshEvalDate, setLastRefreshEvalDate] = useState(null); // Proteção contra loop de refresh

    const generateSuggestions = useCallback(() => {
        const ranked = PlanningLogic.rankObjectives(objectivesData);
        return PlanningLogic.selectWeeklyObjectives(ranked);
    }, [objectivesData]);

    useEffect(() => {
        let isMounted = true;

        const executePlanningFlow = async () => {
            if (!sessionId || !classId || !sessionDate) return;
            if (loadingAnalysis && (!objectivesData || objectivesData.length === 0)) return;
            if (planning && weekStatus && weekStatus !== 'stale') return;

            if (isMounted) setLoadingPlanning(true);

            try {
                // Obter dados essenciais
                const existing = await SessionService.getPlanning(idTenant, idBranch, sessionId);
                const lastEvalDate = await EvaluationService.getLastClassEvaluationDate(idTenant, idBranch, classId);

                let isStale = false;
                const evalDate = lastEvalDate ? (lastEvalDate.toDate ? lastEvalDate.toDate() : new Date(lastEvalDate)) : null;

                // Checagem de Obsolescência
                if (existing && evalDate && existing.createdAt) {
                    const planDate = existing.createdAt.toDate ? existing.createdAt.toDate() : new Date(existing.createdAt);

                    if (isAfter(evalDate, planDate)) {
                        // Plano obsoleto. Verificar frescor da análise.
                        const analysisDate = analyzedAt ? new Date(analyzedAt) : null;

                        // Se não temos data de análise ou a análise é mais antiga que a avaliação
                        if (!analysisDate || isAfter(evalDate, analysisDate)) {
                            const evalIso = evalDate.toISOString();

                            // Proteção contra loop: Só pede refresh UMA VEZ para cada avaliação
                            // Se já pedimos refresh para esta avaliação, assumimos que os dados atuais são os melhores possíveis
                            if (lastRefreshEvalDate !== evalIso) {
                                console.log(`[Planning] Refresh necessário. Eval: ${evalIso}. Analysis: ${analysisDate?.toISOString()}`);

                                if (refreshAnalysis) {
                                    if (isMounted) setLastRefreshEvalDate(evalIso); // Marca como processada
                                    refreshAnalysis();
                                    if (isMounted) setLoadingPlanning(false);
                                    return; // Aborta fluxo atual
                                }
                            } else {
                                console.log("[Planning] Refresh já solicitado (loop prevent). Prosseguindo com dados atuais.");
                            }
                        }

                        isStale = true;
                        console.log(`[Planning] Plano ${existing.id} obsoleto. Regenerando...`);
                    }
                }

                if (existing && !isStale) {
                    if (isMounted) {
                        setPlanning(existing);
                        setWeekStatus('existing');
                        setLoadingPlanning(false);
                    }
                    return;
                }

                // Se chegou aqui, vamos gerar novo plano (Stale ou Inexistente).
                if (loadingAnalysis || !objectivesData || objectivesData.length === 0) {
                    if (isMounted) setLoadingPlanning(false);
                    return;
                }

                // Consistência Semanal
                const dateObj = new Date(sessionDate + 'T12:00:00');
                const start = format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                const end = format(endOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');

                const weeklyFocus = await SessionService.findPlanningForWeek(
                    idTenant, idBranch, classId, start, end
                );

                let newPlanPayload = null;
                let status = 'new';
                let validWeeklyFocus = weeklyFocus;

                if (validWeeklyFocus && evalDate && validWeeklyFocus.createdAt) {
                    const focusDate = validWeeklyFocus.createdAt.toDate ? validWeeklyFocus.createdAt.toDate() : new Date(validWeeklyFocus.createdAt);
                    if (isAfter(evalDate, focusDate)) {
                        console.log("[Planning] Foco semanal obsoleto. Gerando novo foco.");
                        validWeeklyFocus = null;
                    }
                }

                if (validWeeklyFocus && validWeeklyFocus.sessionId !== sessionId) {
                    // Herança
                    newPlanPayload = {
                        objectives: weeklyFocus.objectives,
                        weekId: `${format(dateObj, 'yyyy')}-W${format(dateObj, 'w')}`,
                        isWeeklyFocus: false,
                        inheritedFromSessionId: weeklyFocus.sessionId,
                        createdAt: new Date(),
                        reason: 'Herança Semanal'
                    };
                    status = 'inherited';
                } else {
                    // Novo Foco
                    const suggestions = generateSuggestions();

                    if (suggestions && suggestions.length > 0) {
                        newPlanPayload = {
                            objectives: suggestions,
                            weekId: `${format(dateObj, 'yyyy')}-W${format(dateObj, 'w')}`,
                            isWeeklyFocus: true,
                            createdAt: new Date(),
                            generatedAt: new Date().toISOString()
                        };
                        status = 'new';
                    }
                }

                if (newPlanPayload) {
                    const saved = await SessionService.savePlanning(
                        idTenant, idBranch, user, sessionId, newPlanPayload
                    );

                    if (isMounted) {
                        setPlanning(saved);
                        setWeekStatus(status);
                    }

                    if (status === 'new') {
                        SessionService.generateFuturePlannings(
                            idTenant, idBranch, user, classId, sessionDate, objectivesData
                        ).catch(e => console.error("Erro background future planning:", e));
                    }
                }

            } catch (error) {
                console.error("Erro useSessionPlanning:", error);
            } finally {
                if (isMounted) setLoadingPlanning(false);
            }
        };

        executePlanningFlow();

        return () => { isMounted = false };
    }, [
        sessionId, classId, sessionDate,
        loadingAnalysis, objectivesData, analyzedAt,
        idTenant, idBranch, user,
        generateSuggestions, refreshAnalysis,
        lastRefreshEvalDate, planning, weekStatus
    ]);

    const updatePlanning = useCallback(async (newObjectives, propagateToFuture = true) => {
        if (!sessionId || !classId) return;
        setLoadingPlanning(true);
        try {
            const dateObj = new Date(sessionDate + 'T12:00:00');
            const newPlanPayload = {
                objectives: newObjectives,
                weekId: `${format(dateObj, 'yyyy')}-W${format(dateObj, 'w')}`,
                isWeeklyFocus: true,
                isManual: true,
                updatedAt: new Date(),
                createdAt: new Date(),
                updatedBy: user?.uid
            };

            const saved = await SessionService.savePlanning(
                idTenant, idBranch, user, sessionId, newPlanPayload
            );

            if (saved) {
                setPlanning(saved);
                setWeekStatus('manual');

                if (propagateToFuture) {
                    SessionService.generateFuturePlannings(
                        idTenant, idBranch, user, classId, sessionDate, objectivesData
                    ).catch(e => console.error("Erro background future planning:", e));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingPlanning(false);
        }
    }, [sessionId, classId, sessionDate, idTenant, idBranch, user, objectivesData]);

    return { planning, loadingPlanning, weekStatus, updatePlanning };
};
