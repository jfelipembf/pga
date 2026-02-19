import { useState, useCallback } from 'react';
import { EvaluationService } from '../../../../services/Evaluations/EvaluationService';
import { EvaluationLevelService } from '../../../../services/Admin/EvaluationLevelService';
import { ActivityService } from '../../../../services/Admin/ActivityService';
import { useTenant } from '../../../../hooks/useTenant';
import { toast } from 'react-toastify';

/**
 * Hook Especialista em Análise de Progresso do Aluno
 * Calcula:
 * 1. Progresso individual (Analise de Prontidão)
 * 2. Análise da Turma (Média por tópico) em estrutura hierárquica (Objetivo -> Tópicos)
 */
export const useEvaluationAnalysis = () => {
    const { idTenant, idBranch } = useTenant();
    const [analysis, setAnalysis] = useState({}); // Mapa de alunoId -> dados de prontidão
    const [objectivesData, setObjectivesData] = useState([]); // Array de Objetivos com seus Tópicos e estatísticas
    const [evaluationConfig, setEvaluationConfig] = useState({ maxLevelValue: 0, levelValueMap: {} });
    const [loading, setLoading] = useState(false);

    const analyzeStudents = useCallback(async (students, idActivity) => {
        if (!students || students.length === 0 || !idActivity) return;

        setLoading(true);
        try {
            // 1. Buscar níveis de avaliação (valores)
            const levels = await EvaluationLevelService.listAll(idTenant, idBranch);
            const activeLevels = levels.filter(l => l.isActive !== false && !l.deletedAt);

            const levelValueMap = {};
            activeLevels.forEach(l => {
                levelValueMap[l.id] = Number(l.value || 0);
            });
            const maxLevelValue = activeLevels.length > 0 ? Math.max(...activeLevels.map(l => Number(l.value || 0))) : 0;

            setEvaluationConfig({ maxLevelValue, levelValueMap });

            // 2. Buscar Dados da Atividade
            const activityData = await ActivityService.findById(idTenant, idBranch, idActivity);
            const objectivesList = Object.values(activityData?.objectives || {}).sort((a, b) => (a.order || 0) - (b.order || 0));

            // 3. Buscar Avaliações
            const latestEvaluations = await EvaluationService.getLatestEvaluationsForClients(
                idTenant,
                idBranch,
                idActivity,
                students.map(s => s.id)
            );

            // PROCESSAR ANÁLISE INDIVIDUAL
            const results = {};
            students.forEach(student => {
                const evalData = latestEvaluations[student.id];

                if (!evalData) {
                    results[student.id] = {
                        status: 'no_data',
                        progress: 0,
                        fundamentalPendencies: [],
                        levelName: 'N/A'
                    };
                    return;
                }

                const criteria = evalData.criteria || [];
                const fundamentalItems = criteria.filter(c => c.isFundamental === true);
                const generalItems = criteria.filter(c => c.isFundamental !== true);

                const fundamentalPendencies = fundamentalItems
                    .filter(c => c.achieved !== true)
                    .map(c => c.name);

                let totalPossible = generalItems.length * maxLevelValue;
                let totalAchieved = generalItems.reduce((sum, c) => sum + (levelValueMap[c.idLevel] || 0), 0);

                let percentage = 0;
                if (totalPossible > 0) percentage = (totalAchieved / totalPossible) * 100;
                else if (generalItems.length === 0) percentage = 100;

                const isFundamentalsOk = fundamentalPendencies.length === 0;
                const isGeneralOk = percentage >= 85;

                let status = isFundamentalsOk
                    ? (isGeneralOk ? 'ready' : 'warning')
                    : 'attention';

                results[student.id] = {
                    status,
                    progress: Math.round(percentage),
                    fundamentalPendencies,
                    lastEvaluationDate: evalData.date,
                    levelName: evalData.levelName || 'Nível Atual',
                    criteriaMap: criteria.reduce((acc, c) => { acc[c.id] = c; return acc; }, {})
                };
            });
            setAnalysis(results);

            // PROCESSAR ESTATÍSTICAS DOS TÓPICOS (AGRUPADO POR OBJETIVO)
            const processedObjectives = objectivesList.map(obj => {
                const objTopics = Object.values(obj.topics || {})
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                const topicsWithStats = objTopics.map(topic => {
                    let sumValues = 0;

                    students.forEach(student => {
                        const studentRes = results[student.id];
                        if (studentRes && studentRes.criteriaMap && studentRes.criteriaMap[topic.id]) {
                            const crit = studentRes.criteriaMap[topic.id];

                            let val = 0;
                            if (crit.idLevel && levelValueMap[crit.idLevel] !== undefined) {
                                val = levelValueMap[crit.idLevel];
                            } else if (crit.achieved) {
                                val = maxLevelValue;
                            }
                            sumValues += val;
                        }
                    });

                    const totalStudents = students.length;
                    const average = totalStudents > 0 ? (sumValues / totalStudents) : 0;
                    const percentage = maxLevelValue > 0 ? (average / maxLevelValue) * 100 : 0;

                    return {
                        id: topic.id,
                        name: topic.description,
                        order: topic.order,
                        isFundamental: topic.isFundamental,
                        averageValue: average.toFixed(1),
                        percentage: Math.round(percentage)
                    };
                });

                return {
                    id: obj.id,
                    title: obj.title,
                    order: obj.order,
                    topics: topicsWithStats
                };
            });

            setObjectivesData(processedObjectives);

        } catch (error) {
            console.error("Erro ao analisar progresso:", error);
            toast.error("Erro ao calcular dados.");
        } finally {
            setLoading(false);
        }
    }, [idTenant, idBranch]);

    return {
        analysis,
        objectivesData,
        evaluationConfig,
        analyzeStudents,
        loading
    };
};
