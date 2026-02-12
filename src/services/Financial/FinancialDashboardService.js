import { transactionRepository } from "../../data/repositories/TransactionRepository"
import { receivableRepository } from "../../data/repositories/ReceivableRepository"
import { payableRepository } from "../../data/repositories/PayableRepository"
import { bankAccountRepository } from "../../data/repositories/BankAccountRepository"
import { cashierRepository } from "../../data/repositories/CashierRepository"
import { LedgerService } from "../Ledger/LedgerService"
import { query, where, getDocs } from "firebase/firestore"
import moment from "moment"
import { normalizeDate } from "../../utils/date"

export const FinancialDashboardService = {

    /**
     * Calcula os saldos atuais disponíveis (Caixa + Bancos)
     */
    getCurrentBalance: async (idTenant, idBranch) => {
        const accounts = await bankAccountRepository.findActive(idTenant, idBranch);
        const totalBank = accounts.reduce((acc, curr) => acc + (parseFloat(curr.currentBalance) || 0), 0);

        const openSessions = await cashierRepository.findWhere(idTenant, idBranch, [['status', '==', 'open']]);

        let totalCashier = 0;
        for (const session of openSessions) {
            // Cálculo AO VIVO (mesma lógica do useCashier)
            const transactions = await transactionRepository.findBySession(idTenant, idBranch, session.id);
            const opening = parseFloat(session.openingBalance) || 0;
            const netCash = transactions.reduce((sum, t) => {
                const amount = parseFloat(t.amount || 0);
                const netAmount = parseFloat(t.netAmount || amount || 0);

                if (t.type === 'income') {
                    // Apenas dinheiro físico fica na gaveta
                    return (t.method === 'money') ? sum + netAmount : sum;
                } else if (t.type === 'expense') {
                    return sum - amount;
                }
                return sum;
            }, 0);
            totalCashier += (opening + netCash);
        }

        return {
            total: totalBank + totalCashier,
            bank: totalBank,
            cashier: totalCashier
        };
    },

    /**
     * Calcula Totais do Mês e Dados para Gráfico (Diário)
     * 
     * IMPORTANTE: Os totais de receita/despesa vêm do Ledger (balancete contábil),
     * garantindo consistência com a DRE. As transações do caixa são mantidas
     * apenas para alimentar o gráfico diário (visualização operacional).
     */
    getMonthData: async (idTenant, idBranch, date) => {
        try {
            const startDate = moment(date).startOf('month').format('YYYY-MM-DD');
            const endDate = moment(date).endOf('month').format('YYYY-MM-DD');

            // 1. Totais contábeis do Ledger (mesma fonte da DRE)
            let income = 0;
            let expense = 0;
            let hasLedgerData = false;

            try {
                const trialBalance = await LedgerService.getTrialBalance(idTenant, idBranch, startDate, endDate);
                hasLedgerData = trialBalance.length > 0;

                trialBalance.forEach(item => {
                    const accountCode = item.account || '';
                    if (accountCode.startsWith('1.')) {
                        // Grupo 1: Receitas → Créditos - Débitos
                        income += (item.credit - item.debit);
                    } else if (accountCode.startsWith('2.')) {
                        // Grupo 2: Despesas → Débitos - Créditos
                        expense += (item.debit - item.credit);
                    }
                });
            } catch (ledgerError) {
                console.warn("[Dashboard] Fallback: Ledger indisponível, usando transações:", ledgerError.message);
                // Fallback: se Ledger falhar, usa transações
            }

            // 2. Transações do caixa (para gráfico diário e como fallback)
            const start = normalizeDate(moment(date).startOf('month'));
            const end = normalizeDate(moment(date).endOf('month'));
            const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);

            const q = query(
                collectionRef,
                where('date', '>=', start),
                where('date', '<=', end)
            );

            const snapshot = await getDocs(q);
            const transactions = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                    return da - db;
                });

            // Fallback: Se o Ledger NÃO retornou nenhum dado, usa transações como estimativa
            // Exclui transações com skipLedger/systemGenerated para evitar dupla contagem
            if (!hasLedgerData && transactions.length > 0) {
                income = transactions
                    .filter(t => t.type === 'income' && !t.skipLedger && !t.systemGenerated)
                    .reduce((acc, curr) => acc + (parseFloat(curr.netAmount || curr.amount) || 0), 0);

                expense = transactions
                    .filter(t => t.type === 'expense' && !t.skipLedger && !t.systemGenerated)
                    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            }

            return {
                income,
                expense,
                balance: income - expense,
                monthName: moment(date).format('MMMM'),
                transactions
            };
        } catch (error) {
            console.error("Erro ao buscar dados mensais:", error);
            return {
                income: 0,
                expense: 0,
                balance: 0,
                monthName: moment(date).format('MMMM'),
                transactions: []
            };
        }
    },

    /**
     * Inadimplência (A Receber Vencido)
     */
    getOverdueReceivables: async (idTenant, idBranch) => {
        const today = normalizeDate(moment().startOf('day'));

        try {
            // Buscamos apenas pelo status (índice simples, geralmente já existente)
            // e filtramos a data em memória para garantir resiliência total sem índices manuais.
            const openReceivables = await receivableRepository.findWhere(idTenant, idBranch, [
                ['status', '==', 'open']
            ]);

            const overdue = openReceivables.filter(r => {
                const dueDate = moment(r.dueDate?.toDate ? r.dueDate.toDate() : r.dueDate);
                return dueDate.isBefore(today);
            });

            return {
                amount: overdue.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
                count: overdue.length
            };
        } catch (error) {
            console.error("Erro ao processar inadimplência (Receivables):", error);
            return { amount: 0, count: 0 };
        }
    },

    /**
     * Contas a Pagar VENCIDAS (Inadimplência da Empresa)
     */
    getOverduePayables: async (idTenant, idBranch) => {
        const today = normalizeDate(moment().startOf('day'));

        try {
            // Buscamos apenas pelo status e filtramos em memória.
            const allOpen = await payableRepository.findWhere(idTenant, idBranch, [
                ['status', '==', 'open']
            ]);

            const overdue = allOpen.filter(p => {
                const dueDate = moment(p.dueDate?.toDate ? p.dueDate.toDate() : p.dueDate);
                return dueDate.isBefore(today);
            });

            return {
                amount: overdue.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
                count: overdue.length
            };
        } catch (error) {
            console.error("Erro ao processar inadimplência (Payables):", error);
            return { amount: 0, count: 0 };
        }
    }
}
