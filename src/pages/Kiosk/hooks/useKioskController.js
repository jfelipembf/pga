import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../../hooks/useTenant';
import { ClientService } from '../../../services/Clients';

export const useKioskController = () => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);

    // Lógica de Busca Real
    useEffect(() => {
        if (!searchTerm) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length < 3) return; // Opcional: só buscar com 3+ caracteres

            // Previne busca sem contexto
            if (!isReady || !idTenant || !idBranch) {
                console.warn("Kiosk: Contexto de Tenant/Branch não carregado. Verifique se está logado.");
                return;
            }

            setLoading(true);
            try {
                const clients = await ClientService.searchClients(idTenant, idBranch, searchTerm);

                // Mapear para o formato esperado pelo componente
                const mappedResults = clients.map(client => ({
                    id: client.id,
                    name: client.name,
                    code: client.friendlyId || client.cpf, // Fallback para código
                    photo: client.photoUrl,
                    activity: 'Aluno', // Placeholder ou lógica futura
                    teacher: '' // Placeholder ou lógica futura
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

    // Timer de Inatividade para voltar à busca inicial após tempo sem uso
    useEffect(() => {
        let timer;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                if (searchTerm || selectedStudent) {
                    setSearchTerm('');
                    setSelectedStudent(null);
                    setResults([]);
                }
            }, 180000); // Aumentado para 3 minutos de inatividade
        };

        // Inicia o timer ao mudar o estado relevante
        resetTimer();

        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('mousemove', resetTimer); // Adicionado mousemove para desktops

        return () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('mousemove', resetTimer);
        };
    }, [searchTerm, selectedStudent]);

    const handleKeyPress = useCallback((key) => {
        if (key === '⌫') {
            setSearchTerm(prev => prev.slice(0, -1));
        } else if (key === ' ') {
            setSearchTerm(prev => prev + ' ');
        } else {
            setSearchTerm(prev => prev + key);
        }
    }, []);

    const handleSelectStudent = useCallback((student) => {
        setSelectedStudent(student);
        setSearchTerm('');
        setResults([]);
    }, []);

    const handleBackToSearch = useCallback(() => {
        setSelectedStudent(null);
        setSearchTerm('');
        setResults([]);
    }, []);

    return {
        searchTerm,
        results,
        selectedStudent,
        loading,
        isReady,
        handleKeyPress,
        handleSelectStudent,
        handleBackToSearch
    };
};
