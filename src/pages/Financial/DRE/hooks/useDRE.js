import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { DREService } from '../../../../services/Financial/DREService'
import { toast } from 'react-toastify'

/**
 * Hook para gerenciar a DRE (Demonstração do Resultado do Exercício)
 */
export const useDRE = () => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [data, setData] = useState({
        normalizedTransactions: [],
        summary: { totalRevenue: 0, totalExpense: 0, netProfit: 0, profitMargin: 0 },
        loading: true
    })
    const [period, setPeriod] = useState('month')

    const loadData = useCallback(async () => {
        if (!isReady) return; // Prevent fetch before tenant context is ready
        if (!idTenant || !idBranch) return;

        try {
            setData(prev => ({ ...prev, loading: true }))
            const dreData = await DREService.getDREData(idTenant, idBranch, period)

            setData({
                normalizedTransactions: dreData.normalizedTransactions,
                summary: {
                    receitas: dreData.summary.totalRevenue,
                    despesas: dreData.summary.totalExpense,
                    lucro: dreData.summary.netProfit,
                    margem: dreData.summary.profitMargin
                },
                loading: false
            })
        } catch (error) {
            console.error("Erro ao carregar DRE:", error)
            toast.error("Erro ao carregar dados da DRE")
            setData(prev => ({ ...prev, loading: false }))
        }
    }, [idTenant, idBranch, period, isReady])

    useEffect(() => {
        loadData()
    }, [loadData])

    return {
        transactions: data.normalizedTransactions,
        summary: data.summary,
        loading: data.loading || !isReady, // Força loading enquanto o tenant não estiver pronto
        period,
        setPeriod,
        refresh: loadData
    }
}

