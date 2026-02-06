import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { CashierService } from '../../../../services/Financial/CashierService'
import { BankAccountService } from '../../../../services/Financial/BankAccountService'
import { toast } from 'react-toastify'
import moment from 'moment'

/**
 * Hook para gerenciar a lógica do Fluxo de Caixa
 */
export const useCashFlow = () => {
    const { idTenant, idBranch } = useTenant()
    const [transactions, setTransactions] = useState([]) // Raw transactions from server
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')
    const [customDateRange, setCustomDateRange] = useState({ start: new Date(), end: new Date() })

    // Filtro de Conta Bancária
    const [bankAccounts, setBankAccounts] = useState([])
    const [filterBankAccount, setFilterBankAccount] = useState('all')

    const [fetchLimit, setFetchLimit] = useState(50);
    const [hasMore, setHasMore] = useState(true);

    // Carregar Contas Bancárias
    useEffect(() => {
        if (idTenant && idBranch) {
            BankAccountService.listActive(idTenant, idBranch)
                .then(setBankAccounts)
                .catch(err => console.error("Erro ao carregar contas bancárias:", err))
        }
    }, [idTenant, idBranch])

    // Reset pagination when filter changes
    useEffect(() => {
        setFetchLimit(50);
    }, [period, customDateRange, filterBankAccount]); // Reset também ao mudar conta (opcional, mas bom pra UX)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)

            let start, end;

            if (period === 'day') {
                start = moment().startOf('day');
                end = moment().endOf('day');
            } else if (period === 'week') {
                start = moment().subtract(6, 'days').startOf('day'); // Últimos 7 dias
                end = moment().endOf('day');
            } else if (period === 'month') {
                start = moment().startOf('month');
                end = moment().endOf('month');
            } else if (period === 'custom') {
                start = moment(customDateRange.start).startOf('day');
                end = moment(customDateRange.end).endOf('day');
            } else {
                start = moment().startOf('month');
                end = moment().endOf('month');
            }

            const filters = {
                startDate: start.toDate(),
                endDate: end.toDate()
            }

            // Usar listTransactions com filtros e limite
            // Nota: Filtro de conta bancária será feito no CLIENTE para evitar índices complexos no Firestore
            const txs = await CashierService.listTransactions(idTenant, idBranch, filters, fetchLimit)

            if (txs.length < fetchLimit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setTransactions(txs)
        } catch (error) {
            console.error("Erro ao carregar fluxo de caixa:", error)
            toast.error("Erro ao carregar dados financeiros")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, period, customDateRange, fetchLimit])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            setFetchLimit(prev => prev + 50);
        }
    }, [loading, hasMore]);

    // Filtragem Client-Side
    const filteredTransactions = useMemo(() => {
        if (filterBankAccount === 'all') return transactions;
        return transactions.filter(t => t.idBankAccount === filterBankAccount);
    }, [transactions, filterBankAccount]);

    const totals = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, curr) => acc + (parseFloat(curr.netAmount || curr.amount) || 0), 0)

        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)

        return {
            income,
            expense,
            balance: income - expense
        }
    }, [filteredTransactions]) // Depende dos filtrados

    // Lógica para o Gráfico (Agrupar por dia nos últimos 7 dias indep. do filtro lateral)
    const chartDataGrouped = useMemo(() => {
        const last7Days = []
        for (let i = 6; i >= 0; i--) {
            last7Days.push(moment().subtract(i, 'days').format('DD/MM'))
        }

        const entries = new Array(7).fill(0)
        const exits = new Array(7).fill(0)

        filteredTransactions.forEach(t => { // Usa os filtrados
            const dateStr = moment(t.date?.toDate ? t.date.toDate() : t.date).format('DD/MM')
            const index = last7Days.indexOf(dateStr)
            if (index !== -1) {
                if (t.type === 'income') entries[index] += parseFloat(t.netAmount || t.amount) || 0
                else exits[index] += parseFloat(t.amount) || 0
            }
        })

        return {
            labels: last7Days,
            datasets: [
                {
                    label: 'Entradas',
                    data: entries,
                    borderColor: '#34c38f',
                    backgroundColor: 'rgba(52, 195, 143, 0.2)',
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Saídas',
                    data: exits,
                    borderColor: '#f46a6a',
                    backgroundColor: 'rgba(244, 106, 106, 0.2)',
                    tension: 0.4,
                    fill: true,
                },
            ],
        }
    }, [filteredTransactions])

    return {
        transactions: filteredTransactions, // Retorna os filtrados para a UI
        allTransactionsLength: transactions.length, // Opcional, pra saber total carregado
        loading,
        period,
        setPeriod,
        customDateRange,
        setCustomDateRange,
        totals,
        chartData: chartDataGrouped,
        handleLoadMore,
        hasMore,
        refresh: loadData,
        // Novos retornos de Banco
        bankAccounts,
        filterBankAccount,
        setFilterBankAccount
    }
}
