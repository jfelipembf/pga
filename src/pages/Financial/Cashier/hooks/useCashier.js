import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { CashierService } from '../../../../services/Financial/CashierService'
import { cashierRepository } from '../../../../data/repositories/CashierRepository'
import { transactionRepository } from '../../../../data/repositories/TransactionRepository'
import { staffRepository } from '../../../../data/repositories/StaffRepository'
import { toast } from 'react-toastify'

/**
 * Hook customizado para gerenciar a lógica da página de Caixa.
 */
export const useCashier = () => {
    const { idTenant, idBranch } = useTenant()

    // Obtenção do Usuário (Padrão LocalStorage)
    const user = useMemo(() => {
        const authUser = localStorage.getItem("authUser")
        return authUser ? JSON.parse(authUser) : null
    }, [])

    const [loading, setLoading] = useState(true)
    const [currentSession, setCurrentSession] = useState(null)
    const [activeSessions, setActiveSessions] = useState([])
    const [userProfile, setUserProfile] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [modalOpen, setModalOpen] = useState(false)
    const [modalClose, setModalClose] = useState(false)

    const [selectedDate, setSelectedDate] = useState(new Date())

    const loadData = useCallback(async () => {
        if (!user || !user.uid) {
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

            let sessionsFetched = [];
            let myOpenSession = null;

            if (isToday) {
                // Fetch all active sessions if admin, otherwise just mine
                if (isPowerUser) {
                    sessionsFetched = await cashierRepository.findActiveSessions(idTenant, idBranch);
                    myOpenSession = sessionsFetched.find(s => s.idUser === user.uid);
                } else {
                    myOpenSession = await cashierRepository.findOpenSession(idTenant, idBranch, user.uid);
                    sessionsFetched = myOpenSession ? [myOpenSession] : [];
                }
            } else {
                // Historical: Fetch by date
                const sessionsOfDay = await cashierRepository.findByDate(idTenant, idBranch, selectedDate);
                if (isPowerUser) {
                    sessionsFetched = sessionsOfDay;
                } else {
                    sessionsFetched = sessionsOfDay.filter(s => s.idUser === user.uid);
                }
                myOpenSession = sessionsFetched.find(s => s.idUser === user.uid);
            }

            // Determine which session to show by default
            let initialSession = null;
            let finalSessions = [...sessionsFetched];

            if (sessionsFetched.length > 0) {
                if (isPowerUser && sessionsFetched.length > 1) {
                    // Create a virtual "All Sessions" object for Admins
                    const consolidated = {
                        id: 'all',
                        userName: 'TODOS OS CAIXAS (GERAL)',
                        isConsolidated: true,
                        openingBalance: sessionsFetched.reduce((acc, s) => acc + (parseFloat(s.openingBalance) || 0), 0)
                    };
                    finalSessions = [consolidated, ...sessionsFetched];
                    initialSession = consolidated;
                } else {
                    // One session or regular user: default to first found (or mine)
                    initialSession = myOpenSession || sessionsFetched[0];
                }
            }

            setActiveSessions(finalSessions);
            setCurrentSession(initialSession);

            // 3. Load transactions
            if (initialSession) {
                if (initialSession.id === 'all') {
                    // Fetch for ALL sessions in parallel
                    const allMoves = await Promise.all(
                        sessionsFetched.map(s => transactionRepository.findBySession(idTenant, idBranch, s.id))
                    );
                    // Flatten and sort by date descending
                    const flattened = allMoves.flat().sort((a, b) => {
                        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                        return db - da;
                    });
                    setTransactions(flattened);
                } else {
                    const moves = await transactionRepository.findBySession(idTenant, idBranch, initialSession.id);
                    setTransactions(moves);
                }
            } else {
                setTransactions([]);
            }

        } catch (error) {
            console.error("Erro ao carregar caixa:", error)
            toast.error("Erro ao carregar dados do caixa")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, user, selectedDate])

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
                dinheiro: 0,
                pix: 0,
                cartao_credito: 0,
                cartao_debito: 0,
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
                if (method === 'money' || method === 'dinheiro') {
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
        loading,
        currentSession,
        setCurrentSession,
        activeSessions,
        isAdmin: userProfile?.role === 'admin' || userProfile?.role === 'owner',
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
        setSelectedDate
    }
}
