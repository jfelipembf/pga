import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { CashierService } from '../../../../services/Financial/CashierService'
import { cashierRepository } from '../../../../data/repositories/CashierRepository'
import { transactionRepository } from '../../../../data/repositories/TransactionRepository'
import { staffRepository } from '../../../../data/repositories/StaffRepository'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../hooks/useAuth'

/**
 * Hook customizado para gerenciar a lógica da página de Caixa.
 */
export const useCashier = () => {
    const { idTenant, idBranch, isReady } = useTenant()

    // Obtenção do Usuário (Centralizado)
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [currentSession, setCurrentSession] = useState(null)
    const [activeSessions, setActiveSessions] = useState([])
    const [realSessions, setRealSessions] = useState([]) // Armazena as sessões reais (sem a 'all')
    const [userProfile, setUserProfile] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [modalOpen, setModalOpen] = useState(false)
    const [modalClose, setModalClose] = useState(false)

    const [selectedDate, setSelectedDate] = useState(new Date())

    const [myActiveSession, setMyActiveSession] = useState(null);

    const loadData = useCallback(async () => {
        if (!isReady || !user || !user.uid) {
            return
        }

        try {
            setLoading(true)

            // 1. Fetch Profile and determine Permissions
            const profile = await staffRepository.findByUid(idTenant, idBranch, user.uid);
            setUserProfile(profile);

            const isPowerUser = profile?.role === 'admin' || profile?.role === 'owner' || user?.role === 'admin';

            // Check if selected date is TODAY
            const today = new Date();
            const isToday = selectedDate.toDateString() === today.toDateString();

            // 1. Sempre buscamos as sessões abertas/fechadas do dia selecionado
            let sessionsOfDay = await cashierRepository.findByDate(idTenant, idBranch, selectedDate);

            // 2. Se for hoje, incluímos também sessões que ainda estão abertas (mesmo que iniciadas ontem)
            if (isToday) {
                const activeSessions = await cashierRepository.findActiveSessions(idTenant, idBranch);
                const combined = [...sessionsOfDay];
                activeSessions.forEach(active => {
                    if (!combined.find(s => s.id === active.id)) {
                        combined.push(active);
                    }
                });
                sessionsOfDay = combined;
            }

            // 3. Filtro de visibilidade (Power Users veem tudo do dia, Consultores veem apenas o próprio caixa)
            let sessionsFetched = isPowerUser
                ? sessionsOfDay
                : sessionsOfDay.filter(s => s.idUser === user.uid);

            // 4. Identificamos se o usuário atual tem UM caixa aberto para ações rápidas
            const myOpenSession = sessionsFetched.find(s => s.idUser === user.uid && s.status === 'open');
            setMyActiveSession(myOpenSession);

            // Determine which session to show by default
            let initialSession = null;
            let finalSessions = [...sessionsFetched];

            if (sessionsFetched.length > 0) {
                if (isAdmin && sessionsFetched.length > 1) {
                    // Create a virtual "All Sessions" object for Admins
                    const consolidated = {
                        id: 'all',
                        userName: 'TODOS OS CAIXAS (GERAL)',
                        isConsolidated: true,
                        openingBalance: sessionsFetched.reduce((acc, s) => acc + (parseFloat(s.openingBalance) || 0), 0)
                    };
                    finalSessions = [consolidated, ...sessionsFetched];

                    // UX Improvement: If I have an OPEN session, show it first so I see my buttons.
                    // Otherwise, show the consolidated view.
                    initialSession = myOpenSession || consolidated;
                } else {
                    // One session or regular user: default to most recent (myOpenSession preferred)
                    initialSession = myOpenSession || sessionsFetched[0];
                }
            }

            setRealSessions(sessionsFetched);
            setActiveSessions(finalSessions);

            // 2. Smart Update of Current Session (Prevent resetting user selection)
            setCurrentSession(prev => {
                if (!prev) return initialSession;
                const stillExists = finalSessions.find(s => s.id === prev.id);
                return stillExists || initialSession;
            });

        } catch (error) {
            console.error("Erro ao carregar sessões do caixa:", error)
            toast.error("Erro ao carregar dados do caixa")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady, user, selectedDate])

    // Detect if user is Admin/PowerUser for this branch
    const isAdmin = useMemo(() => {
        return userProfile?.role === 'admin' || userProfile?.role === 'owner' || user?.role === 'admin';
    }, [userProfile, user]);

    // 3. Efeito Reativo para carregar transações quando a sessão muda
    useEffect(() => {
        if (!isReady || !currentSession) {
            setTransactions([]);
            return;
        }

        const fetchTransactions = async () => {
            try {
                if (currentSession.id === 'all') {
                    // Busca transações de TODAS as sessões reais do dia
                    const allMoves = await Promise.all(
                        realSessions.map(s => transactionRepository.findBySession(idTenant, idBranch, s.id))
                    );
                    const flattened = allMoves.flat().sort((a, b) => {
                        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                        return db - da;
                    });
                    setTransactions(flattened);
                } else {
                    // Busca transações apenas da sessão selecionada
                    const moves = await transactionRepository.findBySession(idTenant, idBranch, currentSession.id);
                    setTransactions(moves);
                }
            } catch (error) {
                console.error("Erro ao carregar transações:", error);
            }
        };

        fetchTransactions();
    }, [idTenant, idBranch, isReady, currentSession, realSessions]); // realSessions deve disparar se houver novo caixa aberto

    useEffect(() => {
        loadData()
    }, [loadData])

    const displayUserName = useMemo(() => {
        // 1. Preferência total para o perfil carregado do Firestore
        if (userProfile?.firstName) {
            return `${userProfile.firstName} ${userProfile.lastName || ''}`.trim();
        }
        // 2. Segunda opção: dados que já estão no localStorage (pós-login)
        if (user?.firstName) {
            return `${user.firstName} ${user.lastName || ''}`.trim();
        }
        // 3. Fallbacks: displayName do Firebase Auth ou prefixo do e-mail
        return user?.displayName || user?.email?.split('@')[0] || 'Consultor';
    }, [userProfile, user])

    const handleOpenCashier = async (values) => {
        try {
            await CashierService.openCashier(
                idTenant,
                idBranch,
                user.uid,
                displayUserName,
                values.openingBalance
            )
            setModalOpen(false)
            await loadData()
            toast.success('Caixa aberto com sucesso!')
        } catch (error) {
            toast.error(error.message || 'Erro ao abrir o caixa.')
        }
    }

    const handleCloseCashier = async (values) => {
        try {
            if (!currentSession) return
            await CashierService.closeCashier(
                idTenant,
                idBranch,
                user.uid,
                currentSession.id,
                {
                    actualBalance: parseFloat(values.actualBalance),
                    notes: values.notes
                }
            )
            setModalClose(false)
            await loadData()
            toast.success('Caixa fechado com sucesso!')
        } catch (error) {
            toast.error(error.message || 'Erro ao fechar o caixa.')
        }
    }

    const [movementModalType, setMovementModalType] = useState(null)

    const handleMovement = async (data) => {
        try {
            await CashierService.registerMovement(idTenant, idBranch, user.uid, {
                type: data.type, // 'income' ou 'expense'
                category: data.type === 'income' ? 'supply' : 'withdrawal',
                amount: parseFloat(data.amount),
                netAmount: parseFloat(data.amount), // Assumindo valor líquido igual
                description: data.description,
                userName: displayUserName, // Garante o Snapshot para auditoria
                method: 'money', // Padrão: Dinheiro (Sangria/Suprimento é caixa físico)
                notes: data.notes
            })
            setMovementModalType(null)
            await loadData()
            toast.success(data.type === 'income' ? 'Suprimento registrado!' : 'Sangria registrada!')
        } catch (error) {
            console.error("Erro ao registrar movimento:", error)
            toast.error(error.message || 'Erro ao registrar movimento.')
        }
    }

    const liveSummary = useMemo(() => {
        if (!currentSession) return null;

        const summary = {
            openingBalance: parseFloat(currentSession.openingBalance) || 0,
            totalIncome: 0,
            totalExpenses: 0,
            netCash: 0,
            expectedBalance: 0,
            methods: {
                money: 0,
                pix: 0,
                credit_card: 0,
                debit_card: 0,
                others: 0
            }
        };

        transactions.forEach(t => {
            const amount = parseFloat(t.amount || 0);
            const netAmount = parseFloat(t.netAmount || 0);

            if (t.type === 'income') {
                summary.totalIncome += netAmount;

                const method = t.method || 'others';
                if (summary.methods[method] !== undefined) {
                    summary.methods[method] += netAmount;
                } else {
                    summary.methods.others += netAmount;
                }

                // Apenas dinheiro físico entra na contagem da "gaveta" (expectedBalance)
                if (method === 'money') {
                    summary.netCash += netAmount;
                }
            } else if (t.type === 'expense') {
                summary.totalExpenses += amount;
                summary.netCash -= amount;
            }
        });

        summary.expectedBalance = summary.openingBalance + summary.netCash;
        return summary;
    }, [currentSession, transactions]);

    return {
        idTenant,
        idBranch,
        user,
        userProfile,
        loading: loading || !isReady,
        currentSession,
        setCurrentSession,
        activeSessions,
        isAdmin,
        displayUserName,
        modalOpen,
        setModalOpen,
        modalClose,
        setModalClose,
        handleOpenCashier,
        handleCloseCashier,
        // Manual Movements
        movementModalType,
        setMovementModalType,
        handleMovement,
        transactions,
        liveSummary,
        refresh: loadData,
        selectedDate,
        setSelectedDate,
        myActiveSession
    }
}
