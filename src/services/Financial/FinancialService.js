import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { salesRepository } from '../../data/repositories/SalesRepository'
import { transactionRepository } from '../../data/repositories/TransactionRepository'
import { payableRepository } from '../../data/repositories/PayableRepository'
import moment from 'moment'

/**
 * Serviço Financeiro responsável por Visões de Resumo e Consolidação de Dados.
 * Delegando operações de Caixa para CashierService.
 */
export const FinancialService = {
    /**
     * Obtém o resumo financeiro consolidado de um cliente (Regime de Competência e Caixa).
     */
    getClientFinancialSummary: async (idTenant, idBranch, idClient) => {
        const receivables = await receivableRepository.findWhere(idTenant, idBranch, [
            ['idClient', '==', idClient],
            ['deleted', '==', false]
        ]);

        const summary = {
            totalOwed: 0,
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
            receivablesCount: receivables.length
        };

        const now = moment().startOf('day');

        receivables.forEach(rec => {
            const amount = parseFloat(rec.amount) || 0;
            const paid = parseFloat(rec.paid) || 0;
            const pending = Math.max(0, amount - paid);

            summary.totalOwed += amount;
            summary.totalPaid += paid;
            summary.totalPending += pending;

            if (pending > 0 && rec.dueDate && moment(rec.dueDate).isBefore(now)) {
                summary.totalOverdue += pending;
            }
        });

        return summary;
    },

    /**
     * Obtém todos os recebíveis históricos de um cliente.
     */
    getClientReceivables: async (idTenant, idBranch, idClient) => {
        return await receivableRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient], ['deleted', '==', false]],
            { field: 'dueDate', direction: 'desc' }
        );
    },

    /**
     * Obtém o histórico de vendas de um cliente.
     */
    getClientSales: async (idTenant, idBranch, idClient) => {
        return await salesRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient], ['deleted', '==', false]],
            { field: 'saleDate', direction: 'desc' }
        );
    },

    /**
     * Lista as transações financeiras (Movimentações de Caixa)
     */
    listTransactions: async (idTenant, idBranch, limitCount = 50) => {
        return await transactionRepository.findWhere(idTenant, idBranch,
            [],
            { field: 'date', direction: 'desc' }
        );
    },

    /**
     * Obtém dados para a DRE por Regime de Competência.
     * Receitas = Total das Vendas no período.
     * Despesas = Todas as Contas a Pagar no período + Gastos diretos.
     */
    getDREAccrualData: async (idTenant, idBranch, startDate, endDate) => {
        // Expandir a busca em 1 dia para evitar problemas de fuso horário/timezone
        const expandedStart = moment(startDate).subtract(1, 'day').toDate();
        const expandedEnd = moment(endDate).add(1, 'day').toDate();

        // 1. Buscar todas as Vendas no período expandido
        const sales = await salesRepository.findWhere(idTenant, idBranch, [
            ['saleDate', '>=', expandedStart],
            ['saleDate', '<=', expandedEnd]
        ]);

        // 2. Buscar todas as Contas a Pagar no período (Competência pelo Vencimento)
        const payables = await payableRepository.findWhere(idTenant, idBranch, [
            ['dueDate', '>=', moment(startDate).format('YYYY-MM-DD')],
            ['dueDate', '<=', moment(endDate).format('YYYY-MM-DD')]
        ]);

        // 3. Buscar Movimentações de Caixa diretas (que não são vendas nem pagamentos de boletos)
        // Isso serve para pegar sangrias/despesas rápidas que não passaram pelo "A Pagar"
        const transactions = await transactionRepository.findWhere(idTenant, idBranch, [
            ['date', '>=', startDate],
            ['date', '<=', endDate]
        ]);

        console.log("DRE: Dados brutos carregados", {
            salesCount: sales.length,
            payablesCount: payables.length,
            transactionsCount: transactions.length
        });

        return {
            sales,
            payables,
            transactions
        };
    }
}
