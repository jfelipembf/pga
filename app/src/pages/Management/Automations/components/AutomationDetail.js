import React, { useState, useEffect } from "react"
import { Form, FormGroup, Label, Input, Alert, Row, Col } from "reactstrap"
import ButtonLoader from "../../../../components/Common/ButtonLoader"

import { DEFAULT_MESSAGES } from "../constants/triggers"

const AutomationDetail = ({ automation, onSave, triggerLabels }) => {
    const [active, setActive] = useState(false)
    const [messageTemplate, setMessageTemplate] = useState("")
    const [daysBefore, setDaysBefore] = useState(0)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (automation) {
            setActive(automation.active !== false)
            // If template is empty and it's a temporary (new) config, use default.
            // Or even if existing but empty? Let's assume if empty use default for better UX.
            const defaultMsg = DEFAULT_MESSAGES[automation.type] || ""
            setMessageTemplate(automation.whatsappTemplate || defaultMsg)
            setDaysBefore(automation.config?.daysBefore || 0)
        }
    }, [automation])

    const handleSave = async () => {
        setSaving(true)
        const data = {
            ...automation,
            active,
            whatsappTemplate: messageTemplate,
            config: {
                ...automation.config,
                daysBefore: parseInt(daysBefore) || 0
            }
        }
        await onSave(data)
        setSaving(false)
    }

    if (!automation) {
        return <div className="text-center p-5 text-muted">Selecione um gatilho para configurar.</div>
    }

    const renderConfigFields = () => {
        if (automation.type === "CONTRACT_EXPIRING" || automation.type === "BIRTHDAY") {
            const label = automation.type === "BIRTHDAY" ? "Enviar mensagem ás (horas)" : "Dias antes do vencimento";
            // For birthday, maybe we want config like "send at 9am". For now let's keep it simple or strictly follow "daysBefore" logic if applicable.
            // Actually for Birthday we might want to send ON the day. 
            // If the user wants to configure Time, we can add it later.
            // For now let's stick to daysBefore for contract.

            if (automation.type === "CONTRACT_EXPIRING") {
                return (
                    <Col md={12}>
                        <FormGroup>
                            <Label>{label}</Label>
                            <Input
                                type="number"
                                value={daysBefore}
                                onChange={(e) => setDaysBefore(e.target.value)}
                                min="0"
                            />
                            <small className="text-muted">Ex: 30 para enviar msg 30 dias antes.</small>
                        </FormGroup>
                    </Col>
                )
            }
        }
        return null
    }

    return (
        <React.Fragment>
            <Form>
                <Row>
                    <Col md={12} className="mb-3">
                        <Alert color="info" transition={{ timeout: 0 }}>
                            <strong>{automation.name}</strong>
                            <br />
                            {automation.isTemp ? "Este gatilho ainda não foi configurado." : "Gatilho configurado e salvo."}
                        </Alert>
                    </Col>

                    <Col md={12}>
                        <FormGroup check className="mb-3">
                            <Label check>
                                <Input
                                    type="checkbox"
                                    checked={active}
                                    onChange={(e) => setActive(e.target.checked)}
                                />{' '}
                                <strong>Ativar este gatilho</strong>
                            </Label>
                        </FormGroup>
                    </Col>

                    {renderConfigFields()}

                    <Col md={12}>
                        <FormGroup>
                            <Label>Mensagem (WhatsApp)</Label>
                            <Input
                                type="textarea"
                                rows="8"
                                value={messageTemplate}
                                onChange={(e) => setMessageTemplate(e.target.value)}
                                placeholder="Olá {name}..."
                            />
                            <small className="text-muted d-block mt-1">
                                <strong>Variáveis disponíveis:</strong> {'{name}, {date}, {time}, {professional}'}
                            </small>
                        </FormGroup>
                    </Col>

                    <Col md={12} className="text-end mt-3">
                        <ButtonLoader color="primary" onClick={handleSave} loading={saving}>
                            Salvar Configuração
                        </ButtonLoader>
                    </Col>
                </Row>
            </Form>
        </React.Fragment>
    )
}

export default AutomationDetail
