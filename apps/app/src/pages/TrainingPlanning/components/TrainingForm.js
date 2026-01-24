import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Row, Col, Spinner } from "reactstrap";
import TrainingSection from "./TrainingSection";
import { formatDateDisplay } from "../../../utils/date";

const TrainingForm = ({ date, initialData, onSave, onBack }) => {
    // Initialize sections from initialData or create empty array
    const [sections, setSections] = useState(initialData?.sections || []);
    const [description, setDescription] = useState(initialData?.description || "");
    const [totalDistance, setTotalDistance] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Calculate total distance whenever sections change
    useEffect(() => {
        const total = sections.reduce((acc, section) => {
            const sectionTotal = section.items.reduce((itemAcc, item) => {
                const reps = parseInt(item.reps) || 0;
                const distance = parseInt(item.distance) || 0;
                return itemAcc + (reps * distance);
            }, 0);
            return acc + sectionTotal;
        }, 0);
        setTotalDistance(total);
    }, [sections]);

    const handleAddSection = () => {
        setSections([
            ...sections,
            {
                id: Date.now(),
                name: `Seção ${sections.length + 1}`,
                items: []
            }
        ]);
    };

    const handleChangeSection = (sectionIndex, field, value) => {
        const newSections = [...sections];
        newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value };
        setSections(newSections);
    };

    const handleRemoveSection = (sectionIndex) => {
        const newSections = sections.filter((_, i) => i !== sectionIndex);
        setSections(newSections);
    };

    const handleAddItemToSection = (sectionIndex) => {
        const newSections = [...sections];
        newSections[sectionIndex].items.push({
            id: Date.now(),
            reps: 1,
            exercise: "",
            distance: 50,
            style: null,
            intensity: null,
            equipment: [],
            interval: "",
            observation: ""
        });
        setSections(newSections);
    };


    const handleSave = async () => {
        setIsSaving(true);
        try {
            const workoutData = {
                id: initialData?.id || Date.now(),
                date: date,
                description: description,
                sections: sections,
                totalDistance: totalDistance
            };
            await onSave(workoutData);
        } catch (error) {
            console.error("Error saving workout:", error);
        } finally {
            setIsSaving(false);
        }
    };


    const formattedDate = date ? formatDateDisplay(date, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : "Selecione uma data";

    return (
        <Card className="shadow border-0" style={{ borderRadius: '12px' }}>
            <CardBody className="p-0">
                {/* Header - Gradient Background */}
                <div className="p-4" style={{
                    background: 'linear-gradient(135deg, #466a8f 0%, #5a7fa8 100%)',
                    borderRadius: '12px 12px 0 0'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <Button
                                color="light"
                                size="sm"
                                className="rounded-circle shadow-sm"
                                onClick={onBack}
                                style={{ width: '36px', height: '36px', padding: 0 }}
                                disabled={isSaving}
                            >
                                <i className="mdi mdi-arrow-left"></i>
                            </Button>
                            <div>
                                <h4 className="mb-1 text-white fw-bold">
                                    <i className="mdi mdi-calendar-check me-2"></i>
                                    {initialData ? "Editar Treino" : "Novo Treino"}
                                </h4>
                                <p className="mb-0 text-white-50 small">
                                    <i className="mdi mdi-calendar me-1"></i>
                                    {formattedDate}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4">
                    {/* DESCRIPTION FIELD */}
                    <div className="mb-4">
                        <label className="form-label text-muted text-uppercase font-size-11 fw-bold mb-2">
                            <i className="mdi mdi-text me-1"></i>
                            Descrição do Treino
                        </label>
                        <input
                            type="text"
                            className="form-control form-control-lg bg-light border-0 shadow-sm"
                            placeholder="Ex: Treino de Velocidade - Turma das 15h"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ borderRadius: '8px' }}
                            disabled={isSaving}
                        />
                    </div>

                    {/* SECTIONS */}
                    <div className="workout-sections mb-4">
                        {sections.length === 0 ? (
                            <div className="text-center py-5 bg-light rounded-3 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="mb-3">
                                    <i className="mdi mdi-folder-open-outline text-muted" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                                </div>
                                <h5 className="text-muted mb-2">Nenhuma seção criada</h5>
                                <p className="text-muted mb-4 small">Organize seu treino em seções como "Aquecimento", "Parte Principal", etc.</p>
                                <Button
                                    color="primary"
                                    onClick={handleAddSection}
                                    className="shadow-sm"
                                    style={{ borderRadius: '8px' }}
                                    disabled={isSaving}
                                >
                                    <i className="mdi mdi-plus-circle me-2"></i> Criar Nova Seção
                                </Button>
                            </div>
                        ) : (
                            <>
                                {sections.map((section, index) => (
                                    <TrainingSection
                                        key={section.id}
                                        section={section}
                                        sectionIndex={index}
                                        onChange={handleChangeSection}
                                        onRemove={handleRemoveSection}
                                        onAddItem={handleAddItemToSection}
                                    />
                                ))}
                                <div className="text-center mt-3">
                                    <Button
                                        color="primary"
                                        outline
                                        onClick={handleAddSection}
                                        className="shadow-sm"
                                        style={{ borderRadius: '8px' }}
                                        disabled={isSaving}
                                    >
                                        <i className="mdi mdi-plus-circle me-2"></i> Adicionar Nova Seção
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* FOOTER - Fixed Bottom */}
                <div className="border-top bg-light p-4" style={{ borderRadius: '0 0 12px 12px' }}>
                    <Row className="align-items-center">
                        <Col sm={6}>
                            <div className="d-flex align-items-center gap-2">
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '48px', height: '48px' }}>
                                    <i className="mdi mdi-swim text-primary" style={{ fontSize: '24px' }}></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block text-uppercase" style={{ fontSize: '0.7rem' }}>Total do Treino</small>
                                    <h4 className="mb-0 text-primary fw-bold">{totalDistance}m</h4>
                                </div>
                            </div>
                        </Col>
                        <Col sm={6} className="text-end">
                            <Button
                                color="secondary"
                                outline
                                className="me-2 shadow-sm"
                                onClick={handleAddSection}
                                style={{ borderRadius: '8px' }}
                                disabled={isSaving}
                            >
                                <i className="mdi mdi-plus me-1"></i> Seção
                            </Button>
                            <Button
                                color="primary"
                                onClick={handleSave}
                                disabled={sections.length === 0 || isSaving}
                                className="shadow-sm"
                                style={{ borderRadius: '8px', minWidth: '140px' }}
                            >
                                {isSaving ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <i className="mdi mdi-content-save-outline me-1"></i> Salvar Treino
                                    </>
                                )}
                            </Button>
                        </Col>
                    </Row>
                </div>

            </CardBody>
        </Card>
    );
};


export default TrainingForm;
