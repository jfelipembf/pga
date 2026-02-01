import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { CashierService } from '../../../../services/Financial/CashierService'
import { toast } from 'react-toastify'
import moment from 'moment'

/**
 * Hook para gerenciar a lógica do Fluxo de Caixa
 */
export const useCashFlow = () => {
    const { tenantId: idTenant, branchId: idBranch } = useTenant()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const txs = await CashierService.listTransactions(idTenant, idBranch)
            setTransactions(txs)
        } catch (error) {
            console.error("Erro ao carregar fluxo de caixa:", error)
            toast.error("Erro ao carregar dados financeiros")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Filtragem por Período
    const filteredTransactions = useMemo(() => {
        const now = moment();
        return transactions.filter(t => {
            const tDate = moment(t.date?.toDate ? t.date.toDate() : t.date);
            if (period === 'day') return tDate.isSame(now, 'day');
            if (period === 'week') return tDate.isAfter(moment().subtract(7, 'days'));
            if (period === 'month') return tDate.isSame(now, 'month');
            return true;
        });
    }, [transactions, period]);

    const totals = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)

        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)

        return {
            income,
            expense,
            balance: income - expense
        }
    }, [filteredTransactions])

    // Lógica para o Gráfico (Agrupar por dia nos últimos 7 dias indep. do filtro lateral)
    const chartDataGrouped = useMemo(() => {
        const last7Days = []
        for (let i = 6; i >= 0; i--) {
            last7Days.push(moment().subtract(i, 'days').format('DD/MM'))
        }

        const entries = new Array(7).fill(0)
        const exits = new Array(7).fill(0)

        transactions.forEach(t => {
            const dateStr = moment(t.date?.toDate ? t.date.toDate() : t.date).format('DD/MM')
            const index = last7Days.indexOf(dateStr)
            if (index !== -1) {
                if (t.type === 'income') entries[index] += parseFloat(t.amount) || 0
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
    }, [transactions])

    return {
        transactions: filteredTransactions,
        allTransactions: transactions,
        loading,
        period,
        setPeriod,
        totals,
        chartData: chartDataGrouped,
        refresh: loadData
    }
}
