import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Label, Input, Button, Row, Col, Alert } from 'reactstrap';

export const IntegrationSettings = ({ initialValues, onSave, loading }) => {
    const [data, setData] = useState({
        evolutionUrl: '',
        evolutionKey: '',
        openaiKey: '',
        geminiKey: ''
    });

    useEffect(() => {
        if (initialValues) {
            setData(prev => ({ ...prev, ...initialValues }));
        }
    }, [initialValues]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    }

    return (
        <div className="animate__animated animate__fadeIn">
            <Alert color="info" className="mb-4">
                Aqui você conecta o sistema Lexa às ferramentas externas de IA e Mensageria.
                Essas chaves são salvas com segurança.
            </Alert>

            <Card className="mb-4 border shadow-sm">
                <CardHeader className="bg-transparent border-bottom">
                    <div className="d-flex align-items-center">
                        <i className="mdi mdi-whatsapp text-success font-size-20 me-2"></i>
                        <h5 className="my-0 text-success">Evolution API (WhatsApp)</h5>
                    </div>
                </CardHeader>
                <CardBody>
                    <Row>
                        <Col md={12} className="mb-3">
                            <Label>URL da API</Label>
                            <Input
                                type="text"
                                name="evolutionUrl"
                                value={data.evolutionUrl}
                                onChange={handleChange}
                                placeholder="https://api.evolution.com"
                            />
                            <small className="text-muted">Endereço do seu servidor Evolution API</small>
                        </Col>
                        <Col md={12} className="mb-3">
                            <Label>Global API Key</Label>
                            <Input
                                type="password"
                                name="evolutionKey"
                                value={data.evolutionKey}
                                onChange={handleChange}
                                placeholder="Ex: global-api-key-..."
                            />
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-4 border shadow-sm">
                <CardHeader className="bg-transparent border-bottom">
                    <div className="d-flex align-items-center">
                        <i className="mdi mdi-robot text-primary font-size-20 me-2"></i>
                        <h5 className="my-0 text-primary">Inteligência Artificial</h5>
                    </div>
                </CardHeader>
                <CardBody>
                    <Row>
                        <Col md={12} className="mb-4">
                            <Label className="fw-bold"><i className="mdi mdi-openai me-1"></i> OpenAI (ChatGPT)</Label>
                            <Input
                                type="password"
                                name="openaiKey"
                                value={data.openaiKey}
                                onChange={handleChange}
                                placeholder="sk-..."
                            />
                            <small className="text-muted">Chave de API para gerar textos inteligentes via GPT-4/3.5</small>
                        </Col>

                        <Col md={12} className="border-top pt-3">
                            <Label className="fw-bold"><i className="mdi mdi-google me-1"></i> Google Gemini</Label>
                            <Input
                                type="password"
                                name="geminiKey"
                                value={data.geminiKey}
                                onChange={handleChange}
                                placeholder="AIza..."
                            />
                            <small className="text-muted">Opção alternativa econômica para geração de texto</small>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <div className="d-flex justify-content-end mb-5">
                <Button color="secondary" className="me-2">Cancelar</Button>
                <Button color="primary" onClick={() => onSave(data)} disabled={loading} className="px-4">
                    <i className="mdi mdi-content-save-outline me-1"></i>
                    {loading ? 'Salvando...' : 'Salvar Credenciais'}
                </Button>
            </div>
        </div>
    )
}
