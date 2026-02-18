import React, { useState, useEffect } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Row, Col, Label, Input,
    FormGroup, Spinner, Alert
} from 'reactstrap';
import { MODALITIES, TRAINING_PHASES, TRAINING_OBJECTIVES, SWIMMING_STYLES, INTENSITIES } from '../constants/trainingConstants';

/**
 * AI Training Copilot - Formulário profissional para geração de treino via IA.
 * Todos os campos são editáveis para máxima personalização.
 */
const AITrainingCopilot = ({ isOpen, toggle, onGenerate, poolLength }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Dados do treino
    const [totalDistance, setTotalDistance] = useState('');
    const [sessionDuration, setSessionDuration] = useState('60');
    const [modality, setModality] = useState('competitive');
    const [phase, setPhase] = useState('');
    const [objective, setObjective] = useState('');
    const [mainStyle, setMainStyle] = useState('crawl');
    const [raceDistance, setRaceDistance] = useState('');
    const [focusNotes, setFocusNotes] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!totalDistance && !sessionDuration) {
            setError("Informe a metragem total ou a duração do treino.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const config = {
                totalDistance: totalDistance || null,
                sessionDuration: parseInt(sessionDuration) || 60,
                modality,
                phase,
                objective,
                mainStyle,
                raceDistance: raceDistance || null,
                focusNotes: focusNotes || null,
                poolLength: poolLength || 25
            };
            const result = await onGenerate(config);

            // Só fecha o modal se o treino foi gerado com sucesso
            if (result !== undefined) {
                toggle();
            } else {
                setError("Não foi possível gerar o treino. Verifique sua chave de API e modelo em Sistema > Integrações.");
            }
        } catch (err) {
            console.error("Erro no Copilot:", err);
            setError(err.message || "Erro ao gerar treino. Verifique suas chaves de API.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle} className="border-bottom-0 pb-0">
                <div className="d-flex align-items-center">
                    <div className="bg-soft-info p-2 rounded-circle me-3">
                        <i className="mdi mdi-robot-happy text-info font-size-24"></i>
                    </div>
                    <div>
                        <h5 className="mb-0">Gerar Treino com IA</h5>
                        <small className="text-muted">
                            Piscina de <strong>{poolLength || 25}m</strong> — Preencha os dados e a IA monta o treino completo
                        </small>
                    </div>
                </div>
            </ModalHeader>
            <ModalBody className="py-3">
                {error && <Alert color="danger" fade={false} className="py-2 font-size-12">{error}</Alert>}

                {/* LINHA 1: Metragem e Duração */}
                <Row className="mb-3">
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Metragem Total (metros)</Label>
                            <Input
                                type="number"
                                placeholder="Ex: 3000"
                                value={totalDistance}
                                onChange={e => setTotalDistance(e.target.value)}
                                min="200"
                                step="100"
                            />
                            <small className="text-muted">Se deixar vazio, a IA calcula pela duração.</small>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Duração (minutos)</Label>
                            <Input
                                type="number"
                                value={sessionDuration}
                                onChange={e => setSessionDuration(e.target.value)}
                                min="20"
                                max="180"
                                step="5"
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Nado Principal</Label>
                            <Input
                                type="select"
                                value={mainStyle}
                                onChange={e => setMainStyle(e.target.value)}
                            >
                                {SWIMMING_STYLES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>
                </Row>

                {/* LINHA 2: Modalidade, Fase, Objetivo */}
                <Row className="mb-3">
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Modalidade</Label>
                            <Input
                                type="select"
                                value={modality}
                                onChange={e => setModality(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {MODALITIES.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Fase do Macrociclo</Label>
                            <Input
                                type="select"
                                value={phase}
                                onChange={e => setPhase(e.target.value)}
                            >
                                <option value="">Opção livre</option>
                                {TRAINING_PHASES.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Objetivo do Treino</Label>
                            <Input
                                type="select"
                                value={objective}
                                onChange={e => setObjective(e.target.value)}
                            >
                                <option value="">Opção livre</option>
                                {TRAINING_OBJECTIVES.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Col>
                </Row>

                {/* LINHA 3: Prova Alvo + Instruções */}
                <Row className="mb-2">
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Prova Alvo (opcional)</Label>
                            <Input
                                type="text"
                                placeholder="Ex: 100m Livre, 400m Medley, 1500m..."
                                value={raceDistance}
                                onChange={e => setRaceDistance(e.target.value)}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={8}>
                        <FormGroup className="mb-0">
                            <Label className="font-size-12 fw-bold">Instruções Livres para a IA (opcional)</Label>
                            <Input
                                type="textarea"
                                rows="2"
                                placeholder="Ex: Incluir educativos de golpe. Fazer série principal em progressão descendente. Usar muito palmar."
                                value={focusNotes}
                                onChange={e => setFocusNotes(e.target.value)}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <Alert color="light" fade={false} className="py-2 font-size-11 border mt-3 mb-0">
                    <i className="mdi mdi-information-outline me-1 text-info"></i>
                    A IA gerará um treino completo com <strong>Aquecimento</strong>, <strong>Série Principal</strong> e <strong>Soltura</strong>,
                    usando distâncias múltiplas de <strong>{poolLength || 25}m</strong>.
                    Você poderá editar tudo depois.
                </Alert>
            </ModalBody>
            <ModalFooter className="border-top-0 pt-0">
                <Button color="white" className="border px-4" onClick={toggle} disabled={loading}>
                    Cancelar
                </Button>
                <Button color="primary" className="px-4" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <><Spinner size="sm" className="me-2" /> Gerando...</>
                    ) : (
                        <><i className="mdi mdi-auto-fix me-1"></i> Gerar Treino</>
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AITrainingCopilot;
