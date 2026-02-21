import { LedgerService } from '../Ledger/LedgerService'
import { parseDateRange } from '../../utils/date'

/**
 * Serviço de Inteligência para DRE (Demonstração do Resultado do Exercício)
 * Centraliza a lógica de processamento contábil para geração de relatórios de lucratividade.
 */
export const DREService = {
    /**
     * Gera o relatório DRE baseado na "Verdade Contábil" (Balancete)
     */
    getDREData: async (idTenant, idBranch, filters = {}) => {
        let startDate, endDate;

        if (filters.startDate && filters.endDate) {
            const range = parseDateRange(filters.startDate, filters.endDate);
            startDate = range.startDate;
            endDate = range.endDate;
        } else {
            const period = typeof filters === 'string' ? filters : (filters.period || 'month');
            const now = new Date();

            if (period === 'day') {
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
            } else if (period === 'week') {
                const day = now.getDay(); // 0 = Sunday
                startDate = new Date(now);
                startDate.setDate(now.getDate() - day);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
            } else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
            }
        }

        // 1. Busca o balancete oficial via LedgerService
        const balancete = await LedgerService.getTrialBalance(idTenant, idBranch, startDate, endDate);

        // 2. Processa as contas para o formato do DRE
        const revenues = [];
        const expenses = [];
        let totalRevenue = 0;
        let totalExpense = 0;

        balancete.forEach(conta => {
            // Grupo 1: Receitas
            if (conta.account.startsWith('1')) {
                const valor = (conta.credit || 0) - (conta.debit || 0);
                if (valor !== 0) {
                    totalRevenue += valor;
                    revenues.push({
                        id: conta.account,
                        category: conta.accountName,
                        amount: Math.abs(valor),
                        type: 'income',
                        isNegative: valor < 0 // Raro em receita, mas possível em estornos
                    });
                }
            }
            // Grupo 2: Despesas e Custos
            else if (conta.account.startsWith('2')) {
                const valor = (conta.debit || 0) - (conta.credit || 0);
                if (valor !== 0) {
                    totalExpense += valor;
                    expenses.push({
                        id: conta.account,
                        category: conta.accountName,
                        amount: Math.abs(valor),
                        type: 'expense',
                        isNegative: valor < 0 // Estorno de despesa
                    });
                }
            }
        });

        // 3. Cálculos de indicadores
        const netProfit = totalRevenue - totalExpense;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
            startDate,
            endDate,
            revenues: revenues.sort((a, b) => b.amount - a.amount),
            expenses: expenses.sort((a, b) => b.amount - a.amount),
            summary: {
                totalRevenue,
                totalExpense,
                netProfit,
                profitMargin
            },
            // Formato legado para manter compatibilidade com componentes que esperam arrays simples
            normalizedTransactions: [...revenues, ...expenses]
        };
    }
}
