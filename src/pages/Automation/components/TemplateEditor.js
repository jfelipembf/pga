import React, { useState, useEffect } from 'react';
import { Button, Input, Label, Badge, Row, Col, Spinner, Form, FormGroup } from 'reactstrap';
import { TRIGGER_CONFIG, DEFAULT_MESSAGES } from '../config/triggers';
import { toast } from 'react-toastify';
import { FormSwitch } from '../../../components/Common/FormSwitch';

export const TemplateEditor = ({ customTemplates = {}, activeStatus = {}, onSave, loading, filterCategory = null }) => {
    const [templates, setTemplates] = useState({});
    const [enabledTriggers, setEnabledTriggers] = useState({});

    // Refs para rastrear mudanças nas props sem sobrescrever estado local
    const prevActiveStatusStr = React.useRef(JSON.stringify(activeStatus));
    const prevTemplatesStr = React.useRef(JSON.stringify(customTemplates));

    // Inicialização e Sincronização
    useEffect(() => {
        const currentActiveStatusStr = JSON.stringify(activeStatus || {});
        const currentTemplatesStr = JSON.stringify(customTemplates || {});

        if (prevActiveStatusStr.current !== currentActiveStatusStr) {
            setEnabledTriggers(activeStatus || {});
            prevActiveStatusStr.current = currentActiveStatusStr;
        }

        if (prevTemplatesStr.current !== currentTemplatesStr) {
            setTemplates(customTemplates || {});
            prevTemplatesStr.current = currentTemplatesStr;
        }
    }, [customTemplates, activeStatus]);

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

    const handleToggleTrigger = (key, val) => {
        setEnabledTriggers(prev => ({
            ...prev,
            [key]: val
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSave({ templates, activeStatus: enabledTriggers });
    };

    const handleCancel = () => {
        // Reverter alterações locais
        setTemplates(customTemplates || {});
        setEnabledTriggers(activeStatus || {});
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
        <div className="p-3 bg-white rounded shadow-sm border animate__animated animate__fadeIn">
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h4 className="mb-0 text-dark">
                    {filterCategory ? `Mensagens: ${filterCategory}` : 'Central de Mensagens'}
                </h4>
                <div className="d-flex gap-2">
                    <Button color="secondary" outline onClick={handleCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button color="primary" onClick={handleSave} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : "Salvar Alterações"}
                    </Button>
                </div>
            </div>

            <Form onSubmit={handleSave}>
                {activeTriggers.map((trigger, idx) => {
                    const currentText = templates[trigger.key] !== undefined ? templates[trigger.key] : DEFAULT_MESSAGES[trigger.key];
                    const isCustom = templates[trigger.key] !== undefined && templates[trigger.key] !== DEFAULT_MESSAGES[trigger.key];
                    const isActive = enabledTriggers[trigger.key] !== false; // Default true if undefined

                    return (
                        <div key={trigger.key} className="mb-4 pb-3 border-bottom last-no-border">
                            <Row>
                                <Col md={12}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center gap-3">
                                            <FormSwitch
                                                checked={isActive}
                                                onChange={(val) => handleToggleTrigger(trigger.key, val)}
                                                id={`switch-${trigger.key}`}
                                            />
                                            <Label className="fw-bold fs-6 mb-0 text-dark cursor-pointer" htmlFor={`switch-${trigger.key}`}>
                                                {trigger.label}
                                            </Label>
                                        </div>
                                        {isCustom && (
                                            <Button size="sm" color="link" className="text-danger p-0 font-size-12 text-decoration-none" onClick={() => resetToDefault(trigger.key)}>
                                                <i className="mdi mdi-restore me-1"></i> Restaurar Padrão
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-muted small mb-2 ms-5 ps-2">{trigger.description || "Mensagem automática enviada pelo sistema."}</p>
                                </Col>
                                <Col md={12} className={!isActive ? "opacity-50" : ""}>
                                    <FormGroup className="ms-5 ps-2">
                                        <Input
                                            type="textarea"
                                            rows={4}
                                            value={currentText || ''}
                                            onChange={(e) => handleTemplateChange(trigger.key, e.target.value)}
                                            className="form-control"
                                            placeholder="Digite a mensagem..."
                                            style={{ resize: 'vertical' }}
                                            disabled={!isActive}
                                        />
                                    </FormGroup>
                                </Col>
                                {isActive && (
                                    <Col md={12} className="mt-n2 ms-5 ps-2">
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <span className="text-muted font-size-12"><i className="mdi mdi-code-tags me-1"></i> Variáveis:</span>
                                            {trigger.variables?.map(v => (
                                                <Badge
                                                    key={v}
                                                    color="light"
                                                    className="font-size-11 cursor-pointer p-2 border text-dark"
                                                    onClick={() => addVariable(trigger.key, v, currentText)}
                                                    title="Clique para adicionar"
                                                >
                                                    {v}
                                                </Badge>
                                            ))}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    );
                })}

                {activeTriggers.length === 0 && (
                    <div className="text-center py-5">
                        <p className="text-muted">Nenhum modelo encontrado nesta categoria.</p>
                    </div>
                )}
            </Form>
        </div>
    );
};
