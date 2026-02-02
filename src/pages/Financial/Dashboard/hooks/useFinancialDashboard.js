import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { FinancialDashboardService } from '../../../../services/Financial/FinancialDashboardService'
import { toast } from 'react-toastify'
import moment from 'moment'

export const useFinancialDashboard = () => {
    const { idTenant, idBranch } = useTenant()

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        balance: { total: 0, bank: 0, cashier: 0 },
        performance: { income: 0, expense: 0, balance: 0 },
        inadimplencia: { amount: 0, count: 0 },
        overduePayables: { amount: 0, count: 0 } // Novo
    })
    const [chartData, setChartData] = useState(null)

    const loadDashboard = useCallback(async () => {
        if (!idTenant || !idBranch) return;

        try {
            setLoading(true);

            // Buscar dados
            const [balanceRes, performanceRes, overdueRes, overduePayablesRes] = await Promise.all([
                FinancialDashboardService.getCurrentBalance(idTenant, idBranch),
                FinancialDashboardService.getMonthData(idTenant, idBranch, new Date()),
                FinancialDashboardService.getOverdueReceivables(idTenant, idBranch),
                FinancialDashboardService.getOverduePayables(idTenant, idBranch)
            ]);

            setData({
                balance: balanceRes,
                performance: performanceRes, // Inclui transactions raw
                inadimplencia: overdueRes,
                overduePayables: overduePayablesRes
            });

            // Processar Gráfico (Dia a Dia do Mês Atual)
            const daysInMonth = moment().daysInMonth(); // ex: 30, 31
            const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const incomeSeries = new Array(daysInMonth).fill(0);
            const expenseSeries = new Array(daysInMonth).fill(0);

            if (performanceRes.transactions) {
                performanceRes.transactions.forEach(t => {
                    const day = moment(t.date?.toDate ? t.date.toDate() : t.date).date();
                    const val = parseFloat(t.netAmount || t.amount) || 0;
                    if (t.type === 'income') incomeSeries[day - 1] += val;
                    else expenseSeries[day - 1] += val;
                });
            }

            // Cumulativo ou Por Dia? A imagem sugere uma linha contínua, provavelmente Acumulado ("Total de recebimentos").
            // Mas gráfico de evolução financeira diária (barras ou linhas) costuma ser melhor não-acumulado para ver picos.
            // A referencia diz "Total de recebimentos" (legenda do valor total) e grafico de linha.
            // Vou manter diário (não acumulado) pois revela fluxo de caixa (picos).
            // Se o usuário preferir acumulado (curva S), podemos ajustar.

            setChartData({
                labels: labels.map(l => String(l)),
                datasets: [
                    {
                        label: 'Recebimentos',
                        data: incomeSeries,
                        borderColor: '#34c38f', // Success Green
                        backgroundColor: 'rgba(52, 195, 143, 0.2)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Gastos',
                        data: expenseSeries,
                        borderColor: '#f46a6a', // Danger Red
                        backgroundColor: 'rgba(244, 106, 106, 0.2)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            });

        } catch (error) {
            console.error("Erro ao carregar dashboard financeiro:", error);
            toast.error("Erro ao atualizar indicadores financeiros");
        } finally {
            setLoading(false);
        }
    }, [idTenant, idBranch]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    return {
        loading,
        data,
        chartData,
        refresh: loadDashboard
    }
}
