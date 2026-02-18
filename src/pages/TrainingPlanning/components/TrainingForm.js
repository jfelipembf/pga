import React, { useState, useEffect, useMemo } from "react";
import { Card, CardBody, Button, Row, Col, Spinner, Badge, Alert, Collapse } from "reactstrap";
import Select from "react-select";
import TrainingSection from "./TrainingSection";
import { formatDateDisplay, toISODate } from "../../../utils/date";
import { calculateTotalDistanceFromSections } from "../utils/trainingUtils";
import { validateTraining, calculateZoneDistribution, calculateZoneMeters, calculateEstimatedDuration } from "../utils/trainingValidation";
import { toast } from "react-toastify";
import { TrainingPlanSchema } from "../../../data/schemas/Training/TrainingPlanSchema";
import { usePoolAreas } from "../hooks/usePoolAreas";
import { useTrainingAI } from "../hooks/useTrainingAI";
import AITrainingCopilot from "./AITrainingCopilot";
import { useTrainingPrint } from "./TrainingPrintView";
import {
    MODALITIES,
    TRAINING_PHASES,
    TRAINING_OBJECTIVES,
    TARGET_DISTANCES,
    TRAINING_TEMPLATES,
    SESSION_DURATIONS,
    generateDistanceOptions,
    INTENSITIES
} from "../constants/trainingConstants";

const TrainingForm = ({ date, initialData, onSave, onBack }) => {
    const { pools, loading: loadingPools } = usePoolAreas();
    const { generateWorkout, loading: loadingAI } = useTrainingAI();
    const { printWorkout } = useTrainingPrint();

    const [showCopilot, setShowCopilot] = useState(false);
    const [sections, setSections] = useState(initialData?.sections || []);
    const [description, setDescription] = useState(initialData?.description || "");
    const [totalDistance, setTotalDistance] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Configuração da sessão
    const [selectedPoolId, setSelectedPoolId] = useState(initialData?.poolId || null);
    const [sessionDuration, setSessionDuration] = useState(initialData?.sessionDuration || null);

    // Contexto do treino
    const [modality, setModality] = useState(initialData?.modality || null);
    const [phase, setPhase] = useState(initialData?.phase || null);
    const [objective, setObjective] = useState(initialData?.objective || null);
    const [targetDistance, setTargetDistance] = useState(initialData?.targetDistance || null);

    // UI state
    const [showTemplates, setShowTemplates] = useState(false);
    const [showAlerts, setShowAlerts] = useState(true);

    const selectedPool = useMemo(() => pools.find(p => p.id === selectedPoolId) || null, [pools, selectedPoolId]);

    useEffect(() => {
        if (!selectedPoolId && pools.length === 1) setSelectedPoolId(pools[0].id);
    }, [pools, selectedPoolId]);

    useEffect(() => {
        setTotalDistance(calculateTotalDistanceFromSections(sections));
    }, [sections]);

    const alerts = useMemo(() => {
        const baseAlerts = validateTraining(sections, { modality, phase, objective, targetDistance });
        if (sessionDuration) {
            const estimated = calculateEstimatedDuration(sections);
            if (estimated > sessionDuration) {
                baseAlerts.push({ type: 'warning', icon: 'mdi-alert-circle-outline', message: `Duração estimada (${estimated}m) excede a aula.` });
            }
        }
        return baseAlerts;
    }, [sections, modality, phase, objective, targetDistance, sessionDuration]);

    const estimatedDuration = useMemo(() => calculateEstimatedDuration(sections), [sections]);
    const zoneDistribution = useMemo(() => calculateZoneDistribution(sections.flatMap(s => s.items || [])), [sections]);
    const zoneMeters = useMemo(() => calculateZoneMeters(sections.flatMap(s => s.items || [])), [sections]);

    const handleAddSection = () => {
        setSections([...sections, { id: Date.now(), name: `Seção ${sections.length + 1}`, items: [] }]);
    };

    const handleApplyTemplate = (template) => {
        const poolLen = selectedPool?.length || 25;
        const adaptDist = (dist) => dist % 25 === 0 ? (dist / 25) * poolLen : dist;
        const newSections = template.sections.map(s => ({
            ...s,
            id: Date.now() + Math.random(),
            items: s.items.map(item => ({
                ...item,
                id: Date.now() + Math.random(),
                distance: adaptDist(parseInt(item.distance) || 0)
            }))
        }));
        setSections(prev => [...prev, ...newSections]);
        setShowTemplates(false);
        toast.info(`Treino adaptado para piscina de ${poolLen}m.`);
    };

    const handleApplyAIWorkout = (aiWorkout) => {
        if (aiWorkout) {
            setDescription(aiWorkout.description || description);
            setSections(aiWorkout.sections.map(s => ({
                ...s,
                id: Date.now() + Math.random(),
                items: s.items.map(item => ({
                    ...item,
                    id: Date.now() + Math.random()
                }))
            })));
            toast.success("Treino planejado com sucesso!");
        }
    };

    const handleGenerateWithAI = async (config) => {
        if (!selectedPool) {
            toast.warning("Selecione uma piscina primeiro para a IA ajustar as distâncias.");
            return null;
        }

        const aiWorkout = await generateWorkout({
            ...config,
            poolLength: selectedPool.length,
        });

        if (aiWorkout) {
            handleApplyAIWorkout(aiWorkout);
            return aiWorkout;
        }
        return null;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const workoutData = {
                id: initialData?.id || null,
                dateString: initialData?.dateString || (date ? toISODate(date) : ""),
                description,
                sections,
                totalDistance,
                modality: modality || null,
                phase: phase || null,
                objective: objective || null,
                targetDistance: targetDistance || null,
                poolId: selectedPoolId || null,
                poolName: selectedPool?.name || null,
                poolLength: selectedPool?.length || null,
                sessionDuration: sessionDuration || null,
            };
            await TrainingPlanSchema.validate(workoutData, { abortEarly: false });
            await onSave(workoutData);
        } catch (error) {
            error.inner?.forEach(err => toast.error(err.message));
        } finally {
            setIsSaving(false);
        }
    };

    const durationProgress = sessionDuration && estimatedDuration > 0
        ? Math.min((estimatedDuration / sessionDuration) * 100, 100)
        : 0;

    const selectStyles = {
        control: (base) => ({ ...base, minHeight: '38px', borderRadius: '6px', border: '1px solid #dfe3e7', boxShadow: 'none' }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        singleValue: (base) => ({ ...base, overflow: 'visible' }) // Ajuda em telas estreitas
    };

    return (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: "#fbfcfd" }}>
            {/* Header */}
            <div className="bg-white p-3 p-md-4 border-bottom rounded-top">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2 gap-md-3">

                        <div>
                            <h5 className="mb-0 fw-bold text-dark font-size-16">
                                {initialData ? "Editar Treino" : "Novo Treino"}
                            </h5>
                            <span className="text-muted small">{formattedDate(date)}</span>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <Button
                            color="light"
                            className="btn-light-custom"
                            onClick={onBack}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="secondary"
                            outline
                            className="d-flex align-items-center"
                            onClick={() => printWorkout({
                                sections,
                                description,
                                date,
                                poolName: selectedPool?.name,
                                poolLength: selectedPool?.length
                            })}
                            disabled={sections.length === 0}
                        >
                            <i className="mdi mdi-printer me-1"></i> Imprimir
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleSave}
                            disabled={isSaving || sections.length === 0}
                            style={{ minWidth: '140px' }}
                        >
                            {isSaving ? <Spinner size="sm" /> : "Salvar"}
                        </Button>
                    </div>
                </div>
            </div>


            <CardBody className="p-3 p-md-4">
                {/* Descrição e Piscina */}
                <div className="bg-white p-3 p-md-4 rounded border mb-4 shadow-sm">
                    <Row className="g-3">
                        <Col lg={12}>
                            <label className="text-muted small fw-bold text-uppercase mb-2 d-block">Título do Treino</label>
                            <input
                                type="text"
                                className="form-control form-control-lg border-0 bg-light"
                                placeholder="Descreva este treino..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSaving}
                                style={{ fontSize: '1.1rem' }}
                            />
                        </Col>

                        <Col md={6}>
                            <label className="text-muted small fw-bold text-uppercase mb-2 d-block">Piscina / Local</label>
                            <Select
                                options={pools.map(p => ({ value: p.id, label: `${p.name} (${p.length}m)` }))}
                                value={selectedPoolId ? { value: selectedPoolId, label: `${selectedPool?.name} (${selectedPool?.length}m)` } : null}
                                onChange={(opt) => setSelectedPoolId(opt?.value || null)}
                                placeholder="Escolha a piscina"
                                classNamePrefix="select"
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                            />
                        </Col>

                        <Col md={3} xs={6}>
                            <label className="text-muted small fw-bold text-uppercase mb-2 d-block">Tempo Aula</label>
                            <Select
                                options={SESSION_DURATIONS}
                                value={SESSION_DURATIONS.find(d => d.value === sessionDuration)}
                                onChange={opt => setSessionDuration(opt?.value || null)}
                                placeholder="Minutos"
                                classNamePrefix="select"
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                            />
                        </Col>

                        <Col md={3} xs={6}>
                            <label className="text-muted small fw-bold text-uppercase mb-2 d-block">Volume Total</label>
                            <div className="h-100 d-flex flex-column justify-content-center">
                                <h4 className="mb-0 fw-bold text-primary">{totalDistance}m</h4>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    <small className={`fw-bold ${estimatedDuration > sessionDuration ? 'text-danger' : 'text-success'}`}>
                                        {estimatedDuration} min
                                    </small>
                                    <div className="flex-grow-1" style={{ width: '40px' }}>
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div className={`progress-bar ${estimatedDuration > sessionDuration ? 'bg-danger' : 'bg-success'}`}
                                                style={{ width: `${durationProgress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Filtros e Contexto */}
                <div className="mb-4">
                    <Row className="g-2">
                        <Col md={3} xs={6}>
                            <Select
                                options={MODALITIES}
                                value={MODALITIES.find(m => m.value === modality)}
                                onChange={opt => setModality(opt?.value || null)}
                                placeholder="Modalidade"
                                isClearable
                                classNamePrefix="select"
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                            />
                        </Col>
                        <Col md={3} xs={6}>
                            <Select
                                options={TRAINING_PHASES}
                                value={TRAINING_PHASES.find(p => p.value === phase)}
                                onChange={opt => setPhase(opt?.value || null)}
                                placeholder="Fase / Ciclo"
                                isClearable
                                classNamePrefix="select"
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                            />
                        </Col>
                        <Col md={3} xs={6}>
                            <Select
                                options={TRAINING_OBJECTIVES}
                                value={TRAINING_OBJECTIVES.find(o => o.value === objective)}
                                onChange={opt => setObjective(opt?.value || null)}
                                placeholder="Objetivo"
                                isClearable
                                classNamePrefix="select"
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                            />
                        </Col>
                        <Col md={3} xs={6}>
                            <Button
                                color="white"
                                block
                                className="border text-primary shadow-sm fw-medium d-flex align-items-center justify-content-center"
                                style={{ height: '38px' }}
                                onClick={() => setShowTemplates(!showTemplates)}
                            >
                                <i className="mdi mdi-bookmark-outline me-1"></i> Templates
                            </Button>
                        </Col>
                        <Col md={3} xs={6}>
                            <Button
                                color="info"
                                outline
                                block
                                className="shadow-sm fw-medium d-flex align-items-center justify-content-center"
                                style={{ height: '38px' }}
                                onClick={() => setShowCopilot(true)}
                                disabled={loadingAI || !selectedPool}
                            >
                                {loadingAI ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <i className="mdi mdi-robot-happy-outline me-1"></i> Gerar com IA
                                    </>
                                )}
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* Templates */}
                <Collapse isOpen={showTemplates} className="mb-4">
                    <div className="bg-white p-3 p-md-4 rounded border shadow-sm">
                        <Row className="g-3">
                            {TRAINING_TEMPLATES.map(t => (
                                <Col md={4} key={t.id}>
                                    <div className="p-3 border rounded h-100 bg-light-hover cursor-pointer"
                                        style={{ cursor: 'pointer' }} onClick={() => handleApplyTemplate(t)}>
                                        <div className="fw-bold text-dark font-size-13">{t.name}</div>
                                        <div className="text-muted small truncate-2">{t.description}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </Collapse>

                {/* Alertas */}
                {alerts.length > 0 && (
                    <div className="mb-4">
                        {alerts.map((a, i) => (
                            <div key={i} className={`alert alert-${a.type === 'error' ? 'danger' : 'warning'} border-0 py-2 px-3 mb-2 small d-flex align-items-center gap-2`}>
                                <i className={`mdi ${a.icon || 'mdi-alert-outline'} fs-5`}></i>
                                <span>{a.message}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Seções */}
                <div className="mb-5">
                    {sections.map((section, idx) => (
                        <TrainingSection
                            key={section.id}
                            section={section}
                            sectionIndex={idx}
                            onChange={(idx, field, val) => {
                                const next = [...sections];
                                next[idx] = { ...next[idx], [field]: val };
                                setSections(next);
                            }}
                            onRemove={(idx) => setSections(sections.filter((_, i) => i !== idx))}
                            onAddItem={(idx) => {
                                const next = [...sections];
                                next[idx].items.push({
                                    id: Date.now(),
                                    reps: 1,
                                    distance: selectedPool?.length || 25,
                                    exercise: "",
                                    style: null,
                                    intensity: null,
                                    equipment: [],
                                    interval: ""
                                });
                                setSections(next);
                            }}
                            poolLength={selectedPool?.length}
                        />
                    ))}
                    <div className="text-center mt-3">
                        <Button color="primary" outline onClick={handleAddSection} className="px-4">
                            + Nova Seção de Exercícios
                        </Button>
                    </div>
                </div>
            </CardBody>

            {/* Footer Ação */}
            <div className="bg-white p-3 p-md-4 border-top rounded-bottom sticky-bottom shadow-lg" style={{ zIndex: 100 }}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-auto py-1">
                        {INTENSITIES.filter(z => zoneMeters[z.value] > 0).map(z => (
                            <div key={z.value} className="d-flex align-items-center gap-1 border rounded px-2 py-1 bg-light flex-shrink-0">
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: z.color }}></div>
                                <span className="font-size-11 fw-bold">{z.value} <span className="text-muted font-size-10 fw-normal">{Number(zoneDistribution[z.value] || 0).toFixed(0)}%</span></span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
            {/* IA COPILOT MODAL */}
            <AITrainingCopilot
                isOpen={showCopilot}
                toggle={() => setShowCopilot(!showCopilot)}
                poolLength={selectedPool?.length}
                onGenerate={handleGenerateWithAI}
            />
        </Card>
    );
};

const formattedDate = (date) => date ? formatDateDisplay(date, { weekday: 'long', day: 'numeric', month: 'long' }) : "";

export default TrainingForm;
