import React, { useState, useEffect } from 'react';
import { Card, CardBody, Label, Input, Button, Row, Col, FormFeedback } from 'reactstrap';
import { FormSwitch } from '../../../components/Common/FormSwitch';

export const AutomationForm = ({ value, onChange, onCancel, onSave, onDelete, saving }) => {
    // ... (sem alterações no corpo)

    const [formData, setFormData] = useState({
        name: '',
        trigger: '',
        isActive: true,
        channelConfig: { channel: 'whatsapp', template: '' },
        aiConfig: { enabled: false, provider: 'openai', promptTemplate: '' }
    });

    useEffect(() => {
        if (value) {
            // Merge profundo simples para garantir estrutura
            setFormData(prev => ({
                ...prev,
                ...value,
                channelConfig: { ...prev.channelConfig, ...(value.channelConfig || {}) },
                aiConfig: { ...prev.aiConfig, ...(value.aiConfig || {}) }
            }));
        }
    }, [value]);

    const handleChange = (field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    }

    const handleNestedChange = (parent, field, val) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: val }
        }));
    }

    const triggers = [
        { id: 'EVALUATION_APPROVED', label: 'Avaliação Aprovada (Pedagógico)' },
        { id: 'TRIAL_CLASS_SCHEDULED', label: 'Aula Experimental Agendada (Comercial)' },
        { id: 'TRIAL_CLASS_FINISHED', label: 'Aula Experimental Finalizada (Comercial)' },
        { id: 'PAYMENT_REMINDER', label: 'Lembrete de Pagamento (Financeiro)' },
        { id: 'BIRTHDAY', label: 'Aniversariante do Dia (Relacionamento)' }
    ];

    return (
        <div className="animate__animated animate__fadeIn">
            <h5 className="mb-4">{formData.id ? 'Editar Automação' : 'Nova Automação'}</h5>

            <Row>
                <Col md={8} className="mb-3">
                    <Label>Nome da Automação</Label>
                    <Input
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="Ex: Enviar Feedback de Aprovação"
                    />
                </Col>
                <Col md={4} className="mb-3">
                    <Label className="d-block">Status</Label>
                    <FormSwitch
                        id="isActiveAutomation"
                        checked={formData.isActive}
                        onChange={val => handleChange('isActive', val)}
                        label={formData.isActive ? 'Ativo' : 'Pausado'}
                        onColor="#02a499"
                    />
                </Col>

                <Col md={12} className="mb-4">
                    <Label>Gatilho (Quando executar?)</Label>
                    <Input
                        type="select"
                        value={formData.trigger}
                        onChange={e => handleChange('trigger', e.target.value)}
                    >
                        <option value="">Selecione um gatilho...</option>
                        {triggers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </Input>
                </Col>
            </Row>

            {/* Canal de Envio */}
            <Card className="mb-3 border">
                <CardBody className="bg-light">
                    <h6 className="card-title text-success"><i className="mdi mdi-whatsapp me-1"></i> Configuração do WhatsApp</h6>
                    <div className="mb-3">
                        <Label>Modelo da Mensagem</Label>
                        <Input
                            type="textarea"
                            rows={4}
                            value={formData.channelConfig.template}
                            onChange={e => handleNestedChange('channelConfig', 'template', e.target.value)}
                            placeholder="Olá {clientName}, ..."
                        />
                        <small className="text-muted d-block mt-1">
                            Use variáveis como <code>{`{clientName}`}</code>, <code>{`{levelName}`}</code>.
                            Se usar IA, inclua <code>{`{ai_output}`}</code> onde o texto gerado deve aparecer.
                        </small>
                    </div>
                </CardBody>
            </Card>

            {/* Configuração de IA */}
            <Card className="mb-4 border">
                <CardBody className={formData.aiConfig.enabled ? 'bg-soft-info' : 'bg-light'}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="card-title text-primary mb-0"><i className="mdi mdi-robot me-1"></i> Inteligência Artificial</h6>
                        <FormSwitch
                            id="aiEnabledSwitch"
                            checked={formData.aiConfig.enabled}
                            onChange={val => handleNestedChange('aiConfig', 'enabled', val)}
                            label="Habilitar IA"
                        />
                    </div>

                    {formData.aiConfig.enabled && (
                        <div className="animate__animated animate__fadeIn">
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Label>Provedor</Label>
                                    <Input
                                        type="select"
                                        value={formData.aiConfig.provider}
                                        onChange={e => handleNestedChange('aiConfig', 'provider', e.target.value)}
                                        bsSize="sm"
                                    >
                                        <option value="openai">OpenAI (GPT)</option>
                                        <option value="gemini">Google Gemini</option>
                                    </Input>
                                </Col>
                            </Row>
                            <div className="mb-2">
                                <Label>Prompt para a IA (Instrução)</Label>
                                <Input
                                    type="textarea"
                                    rows={3}
                                    value={formData.aiConfig.promptTemplate}
                                    onChange={e => handleNestedChange('aiConfig', 'promptTemplate', e.target.value)}
                                    placeholder="Ex: Escreva uma mensagem parabenizando {clientName} pela aprovação..."
                                />
                                <small className="text-muted">Descreva como a IA deve agir e o que deve escrever.</small>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-4">
                {onDelete && (
                    <Button color="danger" outline onClick={onDelete} disabled={saving} className="me-auto">
                        <i className="mdi mdi-trash-can-outline me-1"></i> Excluir
                    </Button>
                )}

                <Button color="secondary" onClick={onCancel} disabled={saving}>Cancelar</Button>
                <Button color="primary" onClick={() => onSave(formData)} disabled={saving}>
                    {saving ? <i className="bx bx-loader bx-spin font-size-16 align-middle me-2"></i> : null}
                    Salvar Automação
                </Button>
            </div>
        </div>
    )
}
