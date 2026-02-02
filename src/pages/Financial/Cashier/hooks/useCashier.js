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

    const loadData = useCallback(async () => {
        if (!user || !user.uid) {
            return
        }

        try {
            setLoading(true)

            // 1. Fetch own session and profile
            const [ownSession, profile] = await Promise.all([
                cashierRepository.findOpenSession(idTenant, idBranch, user.uid),
                staffRepository.findByUid(idTenant, idBranch, user.uid)
            ])

            setUserProfile(profile)

            // 2. Logic for Admin/Owner: also fetch other sessions
            const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || user?.role === 'admin'

            if (isAdmin) {
                const allSessions = await cashierRepository.findActiveSessions(idTenant, idBranch)
                setActiveSessions(allSessions)

                // If admin has no own session, show the first available one (or none if none exists)
                if (ownSession) {
                    setCurrentSession(ownSession)
                } else if (allSessions.length > 0) {
                    setCurrentSession(allSessions[0])
                } else {
                    setCurrentSession(null)
                }
            } else {
                setCurrentSession(ownSession)
            }

            // 3. Load transactions for the current session (determinada acima)
            const sessionToLoad = ownSession || (isAdmin && activeSessions.length > 0 ? activeSessions[0] : null);

            if (sessionToLoad) {
                const moves = await transactionRepository.findBySession(idTenant, idBranch, sessionToLoad.id);
                setTransactions(moves);
            } else {
                setTransactions([]);
            }

        } catch (error) {
            console.error("Erro ao carregar caixa:", error)
            toast.error("Erro ao carregar dados do caixa")
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idTenant, idBranch, user])

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
            expectedBalance: 0
        };

        transactions.forEach(t => {
            const amount = parseFloat(t.amount || 0);
            const netAmount = parseFloat(t.netAmount || 0);

            if (t.type === 'income') {
                summary.totalIncome += netAmount;
                // Apenas dinheiro físico entra na contagem da "gaveta" (expectedBalance)
                if (t.method === 'money' || t.method === 'dinheiro') {
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
        refresh: loadData
    }
}
