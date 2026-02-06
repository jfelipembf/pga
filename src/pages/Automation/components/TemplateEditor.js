import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Label, Badge, CardTitle, Row, Col } from 'reactstrap';
import { TRIGGER_CONFIG, DEFAULT_MESSAGES } from '../config/triggers';
import { toast } from 'react-toastify';

export const TemplateEditor = ({ customTemplates = {}, onSave, loading, filterCategory = null }) => {
    const [templates, setTemplates] = useState({});

    // Inicialização
    useEffect(() => {
        setTemplates(customTemplates || {});
    }, [customTemplates]);

    // Filtrar triggers ativos
    const activeTriggers = Object.keys(TRIGGER_CONFIG)
        .filter(key => !filterCategory || TRIGGER_CONFIG[key].category === filterCategory)
        .map(key => ({ key, ...TRIGGER_CONFIG[key] }));

    const handleTemplateChange = (key, value) => {
        setTemplates(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = () => {
        onSave(templates);
    };

    const resetToDefault = (key) => {
        setTemplates(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        toast.info("Template restaurado para o padrão");
    };

    const addVariable = (key, variable, currentText) => {
        const newVal = (currentText || '') + ' ' + variable;
        handleTemplateChange(key, newVal);
    };

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Cabeçalho fake para parecer página */}
            {!filterCategory && (
                <div className="mb-4">
                    <h4 className="font-size-16 text-uppercase">Central de Mensagens</h4>
                    <p className="text-muted">Personalize todas as mensagens automáticas do sistema.</p>
                </div>
            )}

            {/* Lista de Campos (Cards individuais para cada mensagem) */}
            {activeTriggers.map((trigger, idx) => {
                const currentText = templates[trigger.key] !== undefined ? templates[trigger.key] : DEFAULT_MESSAGES[trigger.key];
                const isCustom = templates[trigger.key] !== undefined && templates[trigger.key] !== DEFAULT_MESSAGES[trigger.key];

                return (
                    <Card key={trigger.key} className="mb-3 shadow-sm border">
                        <CardBody>
                            <Row>
                                <Col md={12}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Label className="fw-bold font-size-15 text-dark mb-0">
                                            {trigger.label}
                                        </Label>
                                        {isCustom && (
                                            <Button size="sm" color="link" className="text-danger p-0 font-size-12" onClick={() => resetToDefault(trigger.key)}>
                                                <i className="mdi mdi-restore me-1"></i> Restaurar Padrão
                                            </Button>
                                        )}
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <Input
                                        type="textarea"
                                        rows={5}
                                        value={currentText || ''}
                                        onChange={(e) => handleTemplateChange(trigger.key, e.target.value)}
                                        className="form-control bg-light border-0"
                                        placeholder="Digite a mensagem..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </Col>
                                <Col md={12} className="mt-2">
                                    <div className="d-flex flex-wrap align-items-center gap-2">
                                        <span className="text-muted font-size-12"><i className="mdi mdi-code-tags me-1"></i> Variáveis:</span>
                                        {trigger.variables?.map(v => (
                                            <Badge
                                                key={v}
                                                color="soft-primary"
                                                className="font-size-11 cursor-pointer p-2 border border-primary border-opacity-25"
                                                onClick={() => addVariable(trigger.key, v, currentText)}
                                                title="Clique para adicionar"
                                            >
                                                {v}
                                            </Badge>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                );
            })}

            {activeTriggers.length === 0 && (
                <div className="text-center py-5">
                    <p className="text-muted">Nenhum modelo encontrado nesta categoria.</p>
                </div>
            )}

            <div className="d-flex justify-content-end mt-4 mb-5 pb-5">
                <Button color="secondary" className="me-2" disabled={loading}>Cancelar</Button>
                <Button color="primary" size="lg" onClick={handleSave} disabled={loading} className="px-5">
                    <i className="mdi mdi-content-save me-1"></i>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
};
