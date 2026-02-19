import { useState, useEffect, useCallback, useRef } from 'react';
import { useTenant } from '../../../hooks/useTenant';
import { ClientService } from '../../../services/Clients';
import { toast } from 'react-toastify';

export const useKioskController = () => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estado do reconhecimento facial contínuo
    const [faceScanning, setFaceScanning] = useState(true);
    const [faceMatching, setFaceMatching] = useState(false);

    // Cache de clientes com descriptors faciais para evitar fetch repetido
    const clientsCacheRef = useRef(null);
    const clientsCacheTimeRef = useRef(0);
    const CACHE_TTL = 300000; // 5 minutos de cache

    // Ref para o FaceRecognitionService (lazy loaded)
    const faceServiceRef = useRef(null);

    // Controle de cooldown após match (evita re-scans imediatos)
    const matchCooldownRef = useRef(false);

    // Lógica de Busca Real por nome
    useEffect(() => {
        if (!searchTerm) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length < 3) return;

            if (!isReady || !idTenant || !idBranch) {
                console.warn("Kiosk: Contexto de Tenant/Branch não carregado.");
                return;
            }

            setLoading(true);
            try {
                const clients = await ClientService.searchClients(idTenant, idBranch, searchTerm);

                const mappedResults = clients.map(client => ({
                    id: client.id,
                    name: client.name,
                    code: client.friendlyId || client.cpf,
                    photo: client.photoUrl,
                    activity: 'Aluno',
                    teacher: ''
                }));

                setResults(mappedResults);
            } catch (error) {
                console.error("Erro ao buscar alunos:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, idTenant, idBranch, isReady]);

    // Timer de Inatividade
    useEffect(() => {
        let timer;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                if (searchTerm || selectedClient) {
                    setSearchTerm('');
                    setSelectedClient(null);
                    setResults([]);
                    setFaceScanning(true);
                    matchCooldownRef.current = false;
                }
            }, 180000);
        };

        resetTimer();

        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('mousemove', resetTimer);

        return () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('mousemove', resetTimer);
        };
    }, [searchTerm, selectedClient]);

    // Preload: carrega clientes com face 1x ao abrir o Kiosk (popula cache)
    useEffect(() => {
        if (isReady && idTenant && idBranch) {
            getClientsWithFace();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, idTenant, idBranch]);

    /**
     * Busca clientes com face descriptors do Firestore (com cache).
     */
    const getClientsWithFace = useCallback(async () => {
        const now = Date.now();

        // Retorna cache se válido
        if (clientsCacheRef.current && (now - clientsCacheTimeRef.current) < CACHE_TTL) {
            return clientsCacheRef.current;
        }

        if (!isReady || !idTenant || !idBranch) return [];

        try {
            const clients = await ClientService.listClients(idTenant, idBranch);

            const clientsWithFace = clients
                .filter(c => c.faceDescriptor && Array.isArray(c.faceDescriptor) && c.faceDescriptor.length === 128)
                .map(c => ({
                    id: c.id,
                    name: `${c.firstName} ${c.lastName}`,
                    photo: c.photoUrl,
                    descriptor: c.faceDescriptor
                }));

            clientsCacheRef.current = clientsWithFace;
            clientsCacheTimeRef.current = now;

            return clientsWithFace;
        } catch (error) {
            console.error('[Kiosk] Erro ao carregar clientes com face:', error);
            return [];
        }
    }, [idTenant, idBranch, isReady]);

    const handleSelectClient = useCallback((client) => {
        setSelectedClient(client);
        setSearchTerm('');
        setResults([]);
        setFaceScanning(false);
    }, []);

    /**
     * Callback chamado pelo FaceScanner quando um rosto é detectado.
     * Recebe o descriptor facial e tenta fazer o match.
     */
    const handleFaceDetected = useCallback(async (queryDescriptor) => {
        // Evita processar se já está fazendo match, se tem aluno selecionado, ou está em cooldown
        if (faceMatching || selectedClient || matchCooldownRef.current) return;

        setFaceMatching(true);

        try {
            // Lazy load do serviço
            if (!faceServiceRef.current) {
                const { FaceRecognitionService } = await import('../../../services/FaceRecognition/FaceRecognitionService');
                faceServiceRef.current = FaceRecognitionService;
            }

            // Busca clientes (usa cache)
            const clientsWithFace = await getClientsWithFace();

            if (clientsWithFace.length === 0) {
                // Não mostra toast repetidamente — só uma vez
                return;
            }

            // Encontra o melhor match
            const match = faceServiceRef.current.findBestMatch(queryDescriptor, clientsWithFace, 0.6);

            if (match) {
                // Ativa cooldown para evitar re-match imediato
                matchCooldownRef.current = true;

                // Para o scanning
                setFaceScanning(false);

                toast.success(`✅ Bem-vindo, ${match.name}! (Confiança: ${match.confidence}%)`, {
                    autoClose: 3000
                });

                handleSelectClient({
                    id: match.id,
                    name: match.name,
                    photo: match.photo
                });
            }
            // Se não encontrou match, não faz nada — continua escaneando silenciosamente
        } catch (error) {
            console.error('[Kiosk] Erro no reconhecimento facial:', error);
        } finally {
            setFaceMatching(false);
        }
    }, [faceMatching, selectedClient, getClientsWithFace, handleSelectClient]);

    const handleKeyPress = useCallback((key) => {
        if (key === '⌫') {
            setSearchTerm(prev => prev.slice(0, -1));
        } else if (key === ' ') {
            setSearchTerm(prev => prev + ' ');
        } else {
            setSearchTerm(prev => prev + key);
        }
    }, []);


    const handleBackToSearch = useCallback(() => {
        setSelectedClient(null);
        setSearchTerm('');
        setResults([]);
        setFaceScanning(true);
        matchCooldownRef.current = false;

        // Invalida cache para garantir dados frescos na próxima vez
        clientsCacheRef.current = null;
    }, []);

    return {
        searchTerm,
        results,
        selectedClient,
        loading,
        isReady,
        // Face scanning
        faceScanning,
        faceMatching,
        handleFaceDetected,
        // Actions
        handleKeyPress,
        handleSelectClient,
        handleBackToSearch
    };
};
