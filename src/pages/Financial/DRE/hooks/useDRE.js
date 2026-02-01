import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { FinancialService } from '../../../../services/Financial/FinancialService'
import { toast } from 'react-toastify'
import moment from 'moment'

/**
 * Hook para gerenciar a lógica da DRE por Regime de Competência
 */
export const useDRE = () => {
    const { tenantId: idTenant, branchId: idBranch } = useTenant()
    const [data, setData] = useState({ sales: [], payables: [], transactions: [] })
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    const loadData = useCallback(async () => {
        try {
            setLoading(true)

            let startDate, endDate;
            if (period === 'day') {
                startDate = moment().startOf('day').toDate();
                endDate = moment().endOf('day').toDate();
            } else if (period === 'week') {
                startDate = moment().startOf('week').toDate();
                endDate = moment().endOf('week').toDate();
            } else {
                // Mês: Do primeiro dia às 00:00 ao último às 23:59
                startDate = moment().startOf('month').toDate();
                endDate = moment().endOf('month').toDate();
            }

            console.log("DRE: Carregando período", { startDate, endDate, period });
            const result = await FinancialService.getDREAccrualData(idTenant, idBranch, startDate, endDate)
            setData(result)
        } catch (error) {
            console.error("Erro ao carregar DRE:", error)
            toast.error("Erro ao carregar dados da DRE")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, period])

    useEffect(() => {
        loadData()
    }, [loadData])

    /**
     * Normaliza os dados para o formato que o componente CashFlowDRE espera.
     * Transforma Vendas, Contas a Pagar e Transações Avulsas em uma lista única.
     */
    const normalizedTransactions = useMemo(() => {
        const net = [];

        // 1. Vendas (Receita por Competência)
        if (data.sales && Array.isArray(data.sales)) {
            data.sales
                .filter(s => s.deleted !== true)
                .forEach(s => {
                    net.push({
                        id: s.id,
                        type: 'income',
                        amount: parseFloat(s.total) || 0,
                        category: 'Vendas de Planos/Produtos',
                        date: s.saleDate,
                        description: `Venda #${s.saleNumber || s.id?.substring(0, 6)} - ${s.clientName || 'Cliente'}`
                    });
                });
        }

        // 2. Contas a Pagar (Despesa por Competência)
        if (data.payables && Array.isArray(data.payables)) {
            data.payables
                .filter(p => p.deleted !== true)
                .forEach(p => {
                    net.push({
                        id: p.id,
                        type: 'expense',
                        amount: parseFloat(p.amount) || 0,
                        category: p.chartOfAccountName || 'Despesas Gerais',
                        date: p.dueDate,
                        description: p.description || 'Despesa'
                    });
                });
        }

        // 3. Outras Transações (que não são vinculadas a vendas ou contas a pagar)
        if (data.transactions && Array.isArray(data.transactions)) {
            data.transactions
                .filter(t => t.deleted !== true && t.category !== 'Movimentação Interna (Antecipação)')
                .forEach(t => {
                    const isSaleLinked = !!t.idSale;
                    const isPayableLinked = !!t.idPayable;

                    // Se for uma movimentação avulsa (ex: suprimento manual, despesa rápida sem CP)
                    if (!isSaleLinked && !isPayableLinked) {
                        net.push({
                            ...t,
                            amount: parseFloat(t.amount) || 0,
                            category: t.category || (t.type === 'income' ? 'Outras Receitas' : 'Outras Despesas')
                        });
                    }
                });
        }

        return net;
    }, [data])

    return {
        transactions: normalizedTransactions,
        loading,
        period,
        setPeriod,
        refresh: loadData
    }
}
