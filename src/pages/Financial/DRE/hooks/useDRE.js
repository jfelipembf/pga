import { useState, useEffect, useCallback } from 'react'
import moment from 'moment'
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

    // Filtros de competência
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        startMonth: new Date().getMonth(),
        endMonth: new Date().getMonth(),
    })

    const loadData = useCallback(async () => {
        if (!isReady) return;
        if (!idTenant || !idBranch) return;

        try {
            setData(prev => ({ ...prev, loading: true }))

            // Converte os meses/ano para datas reais para o serviço
            const startDate = moment().year(filters.year).month(filters.startMonth).startOf('month').format('YYYY-MM-DD');
            const endDate = moment().year(filters.year).month(filters.endMonth).endOf('month').format('YYYY-MM-DD');

            const dreData = await DREService.getDREData(idTenant, idBranch, { startDate, endDate })

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
    }, [idTenant, idBranch, isReady, filters.year, filters.startMonth, filters.endMonth])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: parseInt(value) }))
    }

    return {
        transactions: data.normalizedTransactions,
        summary: data.summary,
        loading: data.loading || !isReady,
        filters,
        handleFilterChange,
        refresh: loadData
    }
}

