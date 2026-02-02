import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { LedgerService } from '../../../../services/Ledger/LedgerService'
import { toast } from 'react-toastify'
import moment from 'moment'

/**
 * Hook para gerenciar a DRE (Demonstração do Resultado do Exercício)
 * AGORA USANDO PARTIDAS DOBRADAS (LedgerService)
 * 
 * Este hook busca os lançamentos contábeis do período e gera o DRE
 * a partir do BALANCETE (verdade contábil).
 */
export const useDRE = () => {
    const { idTenant, idBranch } = useTenant()
    const [balancete, setBalancete] = useState([])
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

            console.log("DRE: Carregando balancete do período", { startDate, endDate, period });

            // ✅ NOVA ABORDAGEM: Busca VERDADE CONTÁBIL do Ledger
            const trialBalance = await LedgerService.getTrialBalance(
                idTenant,
                idBranch,
                startDate,
                endDate
            )

            setBalancete(trialBalance)
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
     * Processa o balancete e gera dados para o DRE
     * Formato compatível com CashFlowDRE component
     */
    const normalizedTransactions = useMemo(() => {
        const net = [];

        balancete.forEach(conta => {
            // DETECÇÃO DE GRUPO (Padrão Numérico Estrito)
            const isRevenue = conta.account.startsWith('1');
            const isExpense = conta.account.startsWith('2');

            if (isRevenue) {
                const valor = conta.credit - conta.debit;
                if (valor > 0) {
                    net.push({
                        id: conta.account,
                        category: conta.accountName,
                        amount: valor,
                        type: 'income'
                    });
                }
            } else if (isExpense) {
                const valor = conta.debit - conta.credit;
                if (valor > 0) {
                    net.push({
                        id: conta.account,
                        category: conta.accountName,
                        amount: valor,
                        type: 'expense'
                    });
                }
            }
        });

        return net;
    }, [balancete])

    /**
     * Totalizadores do DRE
     */
    const summary = useMemo(() => {
        const totalReceitas = balancete
            .filter(c => c.account.startsWith('1'))
            .reduce((sum, c) => sum + (c.credit - c.debit), 0)

        const totalDespesas = balancete
            .filter(c => c.account.startsWith('2'))
            .reduce((sum, c) => sum + (c.debit - c.credit), 0)

        return {
            receitas: totalReceitas,
            despesas: totalDespesas,
            lucro: totalReceitas - totalDespesas
        }
    }, [balancete])

    return {
        transactions: normalizedTransactions,
        summary,
        balancete,
        loading,
        period,
        setPeriod,
        refresh: loadData
    }
}
