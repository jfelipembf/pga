
import { useState, useEffect } from 'react';
import { messagingService } from '../../../../services/Automation/MessagingService';
import { aiService } from '../../../../services/Automation/AIService';
import { DEFAULT_MODELS, AI_PROVIDERS } from '../../../../services/Automation/AIModels';
import { toast } from 'react-toastify';

export const useIntegrationForm = (initialValues, onSave) => {
    const [data, setData] = useState({
        evolutionUrl: '',
        evolutionKey: '',
        evolutionInstanceName: '',
        evolutionInstanceToken: '',
        openaiKey: '',
        openaiModel: DEFAULT_MODELS[AI_PROVIDERS.OPENAI],
        geminiKey: '',
        geminiModel: DEFAULT_MODELS[AI_PROVIDERS.GEMINI],
        trainingPrompt: ''
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

    const handleSave = () => {
        onSave(data);
    };

    return {
        data,
        handleChange,
        handleSave,
        // Tests
        testPhone, setTestPhone,
        testMessage, setTestMessage,
        testingWhatsapp,
        runWhatsappTest,
        testPrompt, setTestPrompt,
        testAiResponse,
        testingAi,
        testAiProvider, setTestAiProvider,
        runAiTest,
        // Connection
        connectionStatus,
        checkingStatus,
        checkConnection
    };
};
