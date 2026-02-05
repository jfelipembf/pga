import React, { useState, useEffect } from 'react';
import { Card, CardBody, Collapse, Button, Input, Label, Badge, Row, Col, Alert } from 'reactstrap';
import { TRIGGER_CONFIG, DEFAULT_MESSAGES } from '../config/triggers';
import { toast } from 'react-toastify';

export const TemplateEditor = ({ customTemplates = {}, onSave, loading }) => {
    // Estado local dos templates (mesclando default com custom)
    const [templates, setTemplates] = useState({});

    // Controle de quais categorias estão expandidas
    const [openCategories, setOpenCategories] = useState({});

    // Inicialização
    useEffect(() => {
        setTemplates(customTemplates || {});
        // Abrir todas categorias por padrão
        const allCats = {};
        Object.values(TRIGGER_CONFIG).forEach(cfg => allCats[cfg.category] = true);
        setOpenCategories(allCats);
    }, [customTemplates]);

    // Agrupar triggers por categoria
    const categories = Object.keys(TRIGGER_CONFIG).reduce((acc, key) => {
        const cfg = TRIGGER_CONFIG[key];
        if (!acc[cfg.category]) acc[cfg.category] = [];
        acc[cfg.category].push({ key, ...cfg });
        return acc;
    }, {});

    const handleTemplateChange = (key, value) => {
        setTemplates(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = () => {
        onSave(templates);
    };

    const toggleCategory = (cat) => {
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const resetToDefault = (key) => {
        setTemplates(prev => {
            const next = { ...prev };
            delete next[key]; // Remove customização, volta ao default
            return next;
        });
        toast.info("Template restaurado para o padrão");
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="mb-1 text-primary">Templates de Mensagens</h5>
                    <p className="text-muted small mb-0">Personalize as mensagens automáticas enviadas pelo sistema.</p>
                </div>
                <Button color="primary" onClick={handleSave} disabled={loading}>
                    <i className="mdi mdi-content-save-outline me-1"></i>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            {Object.keys(categories).map((category, idx) => (
                <Card key={idx} className="mb-3 border shadow-none">
                    <div
                        className="card-header bg-light cursor-pointer d-flex justify-content-between align-items-center"
                        onClick={() => toggleCategory(category)}
                    >
                        <h6 className="mb-0 text-dark fw-bold">{category}</h6>
                        <i className={`mdi mdi-chevron-${openCategories[category] ? 'up' : 'down'}`}></i>
                    </div>
                    <Collapse isOpen={openCategories[category]}>
                        <CardBody className="p-0">
                            {categories[category].map((trigger, tIdx) => {
                                const currentText = templates[trigger.key] !== undefined ? templates[trigger.key] : DEFAULT_MESSAGES[trigger.key];
                                const isCustom = templates[trigger.key] !== undefined && templates[trigger.key] !== DEFAULT_MESSAGES[trigger.key];

                                return (
                                    <div key={trigger.key} className={`p-3 ${tIdx < categories[category].length - 1 ? 'border-bottom' : ''}`}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Label className="fw-bold mb-0 font-size-14 text-dark">
                                                {trigger.label}
                                                {isCustom && <Badge color="info" pill className="ms-2 font-size-10">Personalizado</Badge>}
                                            </Label>
                                            {isCustom && (
                                                <Button size="sm" color="link" className="text-danger p-0" onClick={() => resetToDefault(trigger.key)}>
                                                    Restaurar Padrão
                                                </Button>
                                            )}
                                        </div>

                                        <div className="mb-2">
                                            <Input
                                                type="textarea"
                                                rows={4}
                                                value={currentText || ''}
                                                onChange={(e) => handleTemplateChange(trigger.key, e.target.value)}
                                                className="bg-light border-0"
                                                style={{ fontSize: '0.9rem' }}
                                            />
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <span className="text-muted font-size-11 me-2">Variáveis disponíveis:</span>
                                            {trigger.variables?.map(v => (
                                                <Badge key={v} color="soft-primary" className="font-size-11 cursor-pointer"
                                                    onClick={() => {
                                                        const newVal = (currentText || '') + ' ' + v;
                                                        handleTemplateChange(trigger.key, newVal);
                                                    }}
                                                >
                                                    {v}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardBody>
                    </Collapse>
                </Card>
            ))}

            <div className="d-flex justify-content-end mt-4 mb-5">
                <Button color="primary" size="lg" onClick={handleSave} disabled={loading} className="px-5">
                    Salvar Todos os Templates
                </Button>
            </div>
        </div>
    );
};
