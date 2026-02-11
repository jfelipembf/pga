import React from "react"
import { Row, Col, FormGroup, Label, Input } from "reactstrap"

export const EventForm = ({ value, onChange }) => {
    const updateField = (field, val) => {
        onChange({ ...value, [field]: val })
    }

    const updateTestConfig = (field, val) => {
        const newConfig = {
            ...(value.testConfig || {}),
            [field]: val
        }

        // Resetar unidade se o tipo mudar para evitar inconsistência (ex: metro em prova de tempo)
        if (field === 'measureType') {
            newConfig.unit = val === 'distance' ? 'min' : 'm'
        }

        onChange({
            ...value,
            testConfig: newConfig
        })
    }

    return (
        <Row>
            <Col md={8}>
                <FormGroup>
                    <Label>Nome do Ciclo</Label>
                    <Input
                        placeholder="Ex: Primavera 2026, Teste de Coop..."
                        value={value.name || ""}
                        onChange={e => updateField('name', e.target.value)}
                    />
                </FormGroup>
            </Col>
            <Col md={4}>
                <FormGroup>
                    <Label>Tipo</Label>
                    <Input
                        type="select"
                        value={value.type}
                        onChange={e => updateField('type', e.target.value)}
                    >
                        <option value="evaluation">Avaliação Técnica</option>
                        <option value="test">Teste de Performance</option>
                    </Input>
                </FormGroup>
            </Col>

            <Col md={6}>
                <FormGroup>
                    <Label>Início do Período</Label>
                    <Input
                        type="date"
                        value={value.startDate}
                        onChange={e => updateField('startDate', e.target.value)}
                    />
                </FormGroup>
            </Col>
            <Col md={6}>
                <FormGroup>
                    <Label>Fim do Período</Label>
                    <Input
                        type="date"
                        value={value.endDate}
                        onChange={e => updateField('endDate', e.target.value)}
                    />
                </FormGroup>
            </Col>

            {value.type === 'test' && (
                <Col md={12} className="bg-light p-3 rounded mb-3">
                    <h6>Configuração do Teste</h6>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Objetivo do Teste</Label>
                                <Input
                                    type="select"
                                    value={value.testConfig?.measureType}
                                    onChange={e => updateTestConfig('measureType', e.target.value)}
                                >
                                    <option value="distance">Tempo Fixo (Mede Distância)</option>
                                    <option value="time">Distância Fixa (Mede Tempo)</option>
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Referência Fixa</Label>
                                <Input
                                    type="number"
                                    placeholder={value.testConfig?.measureType === 'distance' ? "Ex: 12 (minutos)" : "Ex: 100 (metros)"}
                                    value={value.testConfig?.referenceValue || ""}
                                    onChange={e => updateTestConfig('referenceValue', e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Unidade da Referência</Label>
                                <Input
                                    type="select"
                                    value={value.testConfig?.unit}
                                    onChange={e => updateTestConfig('unit', e.target.value)}
                                >
                                    {value.testConfig?.measureType === 'distance' ? (
                                        <>
                                            <option value="min">Minutos</option>
                                            <option value="sec">Segundos</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="m">Metros</option>
                                            <option value="km">Kilômetros</option>
                                        </>
                                    )}
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>
                </Col>
            )}

            <Col md={12}>
                <FormGroup>
                    <Label>Observações (Opcional)</Label>
                    <Input
                        type="textarea"
                        rows={3}
                        value={value.description || ""}
                        onChange={e => updateField('description', e.target.value)}
                    />
                </FormGroup>
            </Col>
        </Row>
    )
}
