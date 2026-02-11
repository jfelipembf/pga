import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Label, Input, Button, Row, Col, Alert, Spinner } from 'reactstrap';
import { messagingService } from '../../../services/Automation/MessagingService';
import { aiService } from '../../../services/Automation/AIService';
import { toast } from 'react-toastify';

export const IntegrationSettings = ({ initialValues, onSave, loading }) => {
    const [data, setData] = useState({
        evolutionUrl: '',
        evolutionKey: '',
        evolutionInstanceName: '',
        evolutionInstanceToken: '',
        openaiKey: '',
        openaiModel: 'gpt-4o-mini',
        geminiKey: '',
        geminiModel: 'gemini-1.5-flash'
    });

    // Estados de Teste
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Olá! Este é um teste da PGA.');
    const [testingWhatsapp, setTestingWhatsapp] = useState(false);

    const [testPrompt, setTestPrompt] = useState('Qual a capital da França?');
    const [testAiResponse, setTestAiResponse] = useState('');
    const [testingAi, setTestingAi] = useState(false);
    const [testAiProvider, setTestAiProvider] = useState('openai');

    // Estado Conexão
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(false);

    useEffect(() => {
        if (initialValues) {
            setData(prev => ({ ...prev, ...initialValues }));
        }
    }, [initialValues]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    }

    // --- CHECK CONNECTION ---
    const checkConnection = async () => {
        if (!data.evolutionUrl || !data.evolutionInstanceName) return toast.warning("Preencha URL e Nome da Instância");
        setCheckingStatus(true);
        setConnectionStatus(null);
        try {
            const res = await messagingService.getConnectionState(data);
            if (res.success) {
                // Tenta extrair status de vários formatos possíveis da API v1/v2
                const state = res.data?.instance?.state || res.data?.state || (typeof res.data === 'string' ? res.data : 'unknown');
                setConnectionStatus(state);
                if (state === 'open') toast.success(`Conectado! Status: ${state}`);
                else toast.warning(`Instância encontrada, mas status é: ${state}`);
            } else {
                setConnectionStatus('error');
                toast.error('Erro ao verificar: ' + JSON.stringify(res.error));
            }
        } catch (e) {
            toast.error('Erro: ' + e.message);
        } finally {
            setCheckingStatus(false);
        }
    };

    // --- TEST HANDLERS ---
    const runWhatsappTest = async () => {
        if (!testPhone) return toast.warning('Digite um telefone para o teste');
        if (!data.evolutionUrl) {
            return toast.error('Configure a URL do Evolution primeiro');
        }

        setTestingWhatsapp(true);
        try {
            const res = await messagingService.sendText('test', testPhone, testMessage, {
                evolutionUrl: data.evolutionUrl,
                evolutionKey: data.evolutionKey,
                evolutionInstanceName: data.evolutionInstanceName,
                evolutionInstanceToken: data.evolutionInstanceToken,
                apiKey: data.evolutionKey
            });

            if (res.success) {
                toast.success('Teste Enviado! Verifique seu WhatsApp.');
            } else {
                toast.error('Ocorreu um erro: ' + JSON.stringify(res.error || res.data));
            }
        } catch (e) {
            toast.error('Erro ao conectar: ' + e.message);
        } finally {
            setTestingWhatsapp(false);
        }
    };

    const runAiTest = async () => {
        const apiKey = testAiProvider === 'openai' ? data.openaiKey : data.geminiKey;
        if (!apiKey) return toast.error(`Insira a API Key do ${testAiProvider} acima para testar.`);

        setTestingAi(true);
        setTestAiResponse('Gerando resposta...');
        try {
            const model = testAiProvider === 'openai' ? data.openaiModel : data.geminiModel;
            const res = await aiService.generateText(testPrompt, {}, {
                provider: testAiProvider,
                apiKey,
                model
            });
            setTestAiResponse(res);
        } catch (e) {
            setTestAiResponse('ERRO: ' + e.message);
        } finally {
            setTestingAi(false);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">

            {/* CONFIGURAÇÃO EVOLUTION */}
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
                            <Label>Base URL</Label>
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
                                placeholder="Chave Global (Master Key)"
                            />
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label>Nome da Instância (Padrão)</Label>
                            <Input
                                type="text"
                                name="evolutionInstanceName"
                                value={data.evolutionInstanceName || ''}
                                onChange={handleChange}
                                placeholder="ex: MinhaAcademia"
                            />
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label>Token da Instância (Opcional)</Label>
                            <Input
                                type="password"
                                name="evolutionInstanceToken"
                                value={data.evolutionInstanceToken || ''}
                                onChange={handleChange}
                                placeholder="Token específico da instância"
                            />
                        </Col>
                        <Col md={12} className="mb-2">
                            <div className="d-flex align-items-center">
                                <Button size="sm" color="info" outline onClick={checkConnection} disabled={checkingStatus}>
                                    {checkingStatus ? <Spinner size="sm" className="me-1" /> : <i className="mdi mdi-connection me-1"></i>}
                                    Verificar Conexão
                                </Button>
                                {connectionStatus && (
                                    <span className={`ms-2 badge ${connectionStatus === 'open' ? 'bg-success' : connectionStatus === 'error' ? 'bg-danger' : 'bg-warning'} font-size-12`}>
                                        {connectionStatus}
                                    </span>
                                )}
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* CONFIGURAÇÃO IA */}
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
                            <Row>
                                <Col md={8}>
                                    <Label className="small">API Key</Label>
                                    <Input
                                        type="password"
                                        name="openaiKey"
                                        value={data.openaiKey}
                                        onChange={handleChange}
                                        placeholder="sk-..."
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="small">Modelo Padrão</Label>
                                    <Input
                                        type="select"
                                        name="openaiModel"
                                        value={data.openaiModel || 'gpt-4o-mini'}
                                        onChange={handleChange}
                                    >
                                        <option value="gpt-4o">GPT-4o (Mais Inteligente)</option>
                                        <option value="gpt-4o-mini">GPT-4o Mini (Rápido/Econômico)</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    </Input>
                                </Col>
                            </Row>
                            <small className="text-muted mt-1 d-block">Chave de API para gerar textos via GPT.</small>
                        </Col>

                        <Col md={12} className="border-top pt-3">
                            <Label className="fw-bold"><i className="mdi mdi-google me-1"></i> Google Gemini</Label>
                            <Row>
                                <Col md={8}>
                                    <Label className="small">API Key</Label>
                                    <Input
                                        type="password"
                                        name="geminiKey"
                                        value={data.geminiKey}
                                        onChange={handleChange}
                                        placeholder="Insira sua API Key do Google AI Studio"
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="small">Modelo Padrão</Label>
                                    <Input
                                        type="select"
                                        name="geminiModel"
                                        value={data.geminiModel || 'gemini-1.5-flash'}
                                        onChange={handleChange}
                                    >
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Robusto)</option>
                                        <option value="gemini-pro">Gemini 1.0 Pro</option>
                                    </Input>
                                </Col>
                            </Row>
                            <small className="text-muted mt-1 d-block">Gere sua chave no Google AI Studio.</small>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* BOTÕES DE AÇÃO */}
            <div className="d-flex justify-content-end mb-5">
                <Button color="secondary" className="me-2">Cancelar</Button>
                <Button color="primary" onClick={() => onSave(data)} disabled={loading} className="px-4">
                    {loading ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>

            {/* --- ÁREA DE TESTE --- */}
            <h5 className="mb-3 border-top pt-4">Área de Teste de Conectividade</h5>
            <Row>
                {/* Teste WhatsApp */}
                <Col md={6}>
                    <Card className="border bg-soft-success">
                        <CardBody>
                            <h6 className="card-title mb-3"><i className="mdi mdi-whatsapp"></i> Teste de Envio</h6>
                            <Row className="g-2">
                                <Col md={12}>
                                    <Label className="font-size-12">Telefone (com DDD)</Label>
                                    <Input
                                        bsSize="sm"
                                        value={testPhone}
                                        onChange={e => setTestPhone(e.target.value)}
                                        placeholder="5511999999999"
                                    />
                                </Col>
                                <Col md={12}>
                                    <Label className="font-size-12">Mensagem</Label>
                                    <Input
                                        bsSize="sm"
                                        value={testMessage}
                                        onChange={e => setTestMessage(e.target.value)}
                                    />
                                </Col>
                                <Col md={12} className="mt-2">
                                    <Button size="sm" color="success" block onClick={runWhatsappTest} disabled={testingWhatsapp}>
                                        {testingWhatsapp ? <Spinner size="sm" /> : 'Enviar Teste'}
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>

                {/* Teste IA */}
                <Col md={6}>
                    <Card className="border bg-soft-info">
                        <CardBody>
                            <h6 className="card-title mb-3"><i className="mdi mdi-robot"></i> Teste de IA</h6>
                            <Row className="g-2">
                                <Col md={12}>
                                    <div className="btn-group w-100 btn-group-sm mb-2">
                                        <Button
                                            color={testAiProvider === 'openai' ? 'primary' : 'light'}
                                            onClick={() => setTestAiProvider('openai')}
                                            active={testAiProvider === 'openai'}
                                        >OpenAI</Button>
                                        <Button
                                            color={testAiProvider === 'gemini' ? 'primary' : 'light'}
                                            onClick={() => setTestAiProvider('gemini')}
                                            active={testAiProvider === 'gemini'}
                                        >Gemini</Button>
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <Label className="font-size-12">Pergunta / Prompt</Label>
                                    <Input
                                        bsSize="sm"
                                        type="textarea"
                                        rows={2}
                                        value={testPrompt}
                                        onChange={e => setTestPrompt(e.target.value)}
                                    />
                                </Col>
                                <Col md={12} className="mt-2">
                                    <Button size="sm" color="info" block onClick={runAiTest} disabled={testingAi}>
                                        {testingAi ? <Spinner size="sm" /> : 'Perguntar à IA'}
                                    </Button>
                                </Col>
                                {testAiResponse && (
                                    <Col md={12} className="mt-2">
                                        <div className="bg-white p-2 rounded border font-size-12" style={{ maxHeight: 100, overflow: 'auto' }}>
                                            <strong>Resposta:</strong> {testAiResponse}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
