import React, { useState, useEffect } from 'react';
import { Card, CardBody, Progress, Spinner, Badge } from 'reactstrap';
import { evaluationRepository } from '../../../data/repositories/EvaluationRepository';
import { activityRepository } from '../../../data/repositories/ActivityRepository';
import { evaluationLevelRepository } from '../../../data/repositories/EvaluationLevelRepository';
import { useTenant } from '../../../hooks/useTenant';

/**
 * Retorna a cor Bootstrap baseada no valor proporcional do nível
 */
const getLevelColor = (levelValue, maxLevelValue) => {
    const v = Number(levelValue || 0);
    if (v === 0) return "secondary";
    if (maxLevelValue === 0) return "info";

    const percent = (v / maxLevelValue) * 100;
    if (percent >= 90) return "primary";
    if (percent >= 60) return "info";
    if (percent >= 30) return "warning";
    if (percent >= 10) return "secondary";
    return "secondary";
};

/**
 * Item de um tópico com nível obtido
 */
const TopicItem = ({ topic }) => (
    <div className="d-flex align-items-center py-2 px-3 rounded mb-2 bg-light">
        <div className="flex-grow-1">
            <span className="text-dark">{topic.name}</span>
            {topic.isFundamental && (
                <i className="mdi mdi-star text-warning ms-1" title="Fundamental"></i>
            )}
        </div>
        <Badge color={topic.levelColor} className="ms-2 flex-shrink-0 px-2 py-1" pill>
            {topic.levelTitle}
        </Badge>
    </div>
);

/**
 * Card de um objetivo com seus tópicos aninhados
 */
const ObjectiveCard = ({ objective }) => (
    <Card className="mb-3 shadow-sm border-0">
        <CardBody className="p-3">
            <div className="d-flex align-items-center mb-3">
                <i className="mdi mdi-target text-primary fs-5 me-2"></i>
                <h6 className="mb-0 fw-bold text-dark flex-grow-1">{objective.title}</h6>
                <span className="text-muted small">{objective.topics.length} tópicos</span>
            </div>

            {objective.topics.map(topic => (
                <TopicItem key={topic.id} topic={topic} />
            ))}
        </CardBody>
    </Card>
);

/**
 * Página de resultados da avaliação do Kiosk
 * Layout mobile-first / vertical kiosk
 * 
 * Exibe: Aluno > Atividade > Objetivos > Tópicos com Nível
 */
const EvaluationResults = ({ student, onBack }) => {
    const { idTenant, idBranch } = useTenant();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (!student || !idTenant || !idBranch) return;
            setLoading(true);
            try {
                // 1. Buscar última avaliação do aluno
                const evaluations = await evaluationRepository.findByStudent(idTenant, idBranch, student.id);
                if (!evaluations || evaluations.length === 0) {
                    setData(null);
                    return;
                }
                const evaluation = evaluations[0];

                // 2. Buscar atividade com objetivos e tópicos
                const activity = await activityRepository.findByIdWithObjectives(idTenant, idBranch, evaluation.idActivity);
                if (!activity) throw new Error("Atividade não encontrada.");

                // 3. Buscar níveis de avaliação para resolver nomes e cores
                const levels = await evaluationLevelRepository.findAllOrdered(idTenant, idBranch);

                // 4. Processar dados cruzados
                setData(processData(evaluation, activity, levels));
            } catch (err) {
                console.error("Erro ao carregar avaliação:", err);
                setError("Não foi possível carregar os dados da avaliação.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [student, idTenant, idBranch]);

    /**
     * Cruza criteria da avaliação com objectives/topics da atividade.
     * Para cada tópico, resolve o nível obtido (titulo + cor).
     */
    const processData = (evaluation, activity, levels) => {
        if (!activity.objectives) return null;

        // Mapa dos criteria por ID de tópico
        const criteriaMap = new Map();
        evaluation.criteria?.forEach(c => criteriaMap.set(c.id, c));

        // Mapa dos levels por ID
        const levelsMap = new Map();
        levels.forEach(l => levelsMap.set(l.id, l));

        // Valor máximo de nível (para calcular cor proporcional)
        const maxLevelValue = levels.reduce((max, l) => Math.max(max, Number(l.value || 0)), 0);

        // Montar lista de objectives com topics enriquecidos
        const objectivesList = Object.values(activity.objectives)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(obj => {
                const topics = Object.values(obj.topics || {})
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(topic => {
                        const criterion = criteriaMap.get(topic.id);

                        // Resolver nível real
                        let levelTitle = "Não avaliado";
                        let levelColor = "secondary";

                        if (criterion) {
                            const realLevel = levelsMap.get(criterion.idLevel);
                            levelTitle = realLevel ? realLevel.title : (criterion.levelName || "Avaliado");
                            levelColor = realLevel
                                ? getLevelColor(realLevel.value, maxLevelValue)
                                : "info";
                        }

                        return {
                            id: topic.id,
                            name: criterion?.name || topic.description,
                            isFundamental: topic.isFundamental || false,
                            levelTitle,
                            levelColor
                        };
                    });

                return {
                    id: obj.id,
                    title: obj.title,
                    order: obj.order,
                    topics
                };
            });

        // Calcular progresso percentual baseado nos valores dos níveis
        let totalValue = 0;
        let currentValue = 0;
        objectivesList.forEach(obj => {
            obj.topics.forEach(topic => {
                totalValue += maxLevelValue;
                const criterion = criteriaMap.get(topic.id);
                if (criterion) {
                    const realLevel = levelsMap.get(criterion.idLevel);
                    currentValue += Number(realLevel?.value || 0);
                }
            });
        });
        const advancePercentage = totalValue > 0 ? Math.round((currentValue / totalValue) * 100) : 0;

        // Nível geral da avaliação
        const globalLevel = levelsMap.get(evaluation.idLevel);
        const globalLevelTitle = globalLevel ? globalLevel.title : "Não definido";

        return {
            evaluation,
            activity,
            objectives: objectivesList,
            advancePercentage,
            globalLevelTitle,
            totalTopics: objectivesList.reduce((acc, obj) => acc + obj.topics.length, 0)
        };
    };

    // --- Loading ---
    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <Spinner color="primary" className="mb-3" />
                <p className="text-muted">Carregando resultados...</p>
            </div>
        );
    }

    // --- Erro ---
    if (error) {
        return (
            <div className="text-center py-5">
                <i className="mdi mdi-alert-circle-outline display-4 text-warning d-block mb-3"></i>
                <p className="text-muted">{error}</p>
                <button onClick={onBack} className="btn btn-primary">Voltar</button>
            </div>
        );
    }

    // --- Sem avaliação ---
    if (!data) {
        return (
            <div className="text-center py-5">
                <i className="mdi mdi-clipboard-text-off-outline display-4 text-muted d-block mb-3 opacity-50"></i>
                <h5 className="text-dark">Nenhuma avaliação encontrada</h5>
                <p className="text-muted">Este aluno ainda não possui avaliações.</p>
                <button onClick={onBack} className="btn btn-outline-primary rounded-pill px-4 mt-2">
                    <i className="mdi mdi-arrow-left me-1"></i> Voltar
                </button>
            </div>
        );
    }

    const { evaluation, activity, objectives, advancePercentage, globalLevelTitle, totalTopics } = data;

    return (
        <div className="animate__animated animate__fadeIn">

            {/* Botão Voltar */}
            <button onClick={onBack} className="btn btn-sm btn-outline-secondary rounded-pill mb-3">
                <i className="mdi mdi-arrow-left me-1"></i> Voltar
            </button>

            {/* Card do Aluno + Progresso */}
            <Card className="mb-3 shadow-sm border-0">
                <CardBody className="p-3">
                    <div className="d-flex align-items-center mb-3">
                        {/* Foto */}
                        {student.photo ? (
                            <img
                                src={student.photo}
                                alt={student.name}
                                className="rounded-circle me-3 object-fit-cover"
                                style={{ width: '56px', height: '56px' }}
                            />
                        ) : (
                            <div
                                className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold me-3"
                                style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}
                            >
                                {student.name.charAt(0)}
                            </div>
                        )}
                        <div className="flex-grow-1">
                            <h5 className="mb-0 fw-bold text-dark">{student.name}</h5>
                            <small className="text-muted">{activity.name}</small>
                            <br />
                            <small className="text-muted">
                                <i className="mdi mdi-calendar-outline me-1"></i>
                                {new Date(evaluation.date).toLocaleDateString('pt-BR')}
                            </small>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <small className="text-muted flex-shrink-0">{advancePercentage}%</small>
                        <Progress value={advancePercentage} color="primary" style={{ height: '6px' }} className="flex-grow-1 rounded-pill" />
                    </div>
                </CardBody>
            </Card>

            {/* Objetivos */}
            <h6 className="text-muted text-uppercase small fw-bold mb-3">
                <i className="mdi mdi-format-list-checks me-1"></i>
                Objetivos ({objectives.length})
            </h6>

            {objectives.map(obj => (
                <ObjectiveCard key={obj.id} objective={obj} />
            ))}

            {objectives.length === 0 && (
                <p className="text-muted text-center py-4">Nenhum objetivo cadastrado para esta atividade.</p>
            )}
        </div>
    );
};

export default EvaluationResults;
