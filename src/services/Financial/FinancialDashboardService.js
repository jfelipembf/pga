import { transactionRepository } from "../../data/repositories/TransactionRepository"
import { receivableRepository } from "../../data/repositories/ReceivableRepository"
import { payableRepository } from "../../data/repositories/PayableRepository"
import { bankAccountRepository } from "../../data/repositories/BankAccountRepository"
import { cashierRepository } from "../../data/repositories/CashierRepository"
import { query, where, getAggregateFromServer, sum, getDocs } from "firebase/firestore"
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
     * Busca transações reais para montar o gráfico.
     */
    getMonthData: async (idTenant, idBranch, date) => {
        try {
            const start = normalizeDate(moment(date).startOf('month'));
            const end = normalizeDate(moment(date).endOf('month'));
            const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);

            // Buscar transações (sem orderBy para evitar necessidade de índice composto com range)
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

            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((acc, curr) => acc + (parseFloat(curr.netAmount || curr.amount) || 0), 0);

            const expense = transactions
                .filter(t => t.type === 'expense')
                .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

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
        const collectionRef = receivableRepository.getCollectionRef(idTenant, idBranch);

        try {
            const q = query(
                collectionRef,
                where('status', '==', 'open'),
                where('dueDate', '<', today)
            );

            const snapshot = await getAggregateFromServer(q, {
                total: sum('amount'),
                count: sum(1)
            });

            return {
                amount: snapshot.data().total || 0,
                count: snapshot.data().count || 0
            };
        } catch (error) {
            console.warn("Agregação (Receivables) falhou. Fallback manual.");
            const openReceivables = await receivableRepository.findWhere(idTenant, idBranch, [['status', '==', 'open']]);
            const overdue = openReceivables.filter(r => moment(r.dueDate?.toDate ? r.dueDate.toDate() : r.dueDate).isBefore(today));
            return {
                amount: overdue.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
                count: overdue.length
            };
        }
    },

    /**
     * Contas a Pagar VENCIDAS (Inadimplência da Empresa)
     */
    getOverduePayables: async (idTenant, idBranch) => {
        const today = normalizeDate(moment().startOf('day'));
        const collectionRef = payableRepository.getCollectionRef(idTenant, idBranch);

        try {
            const q = query(
                collectionRef,
                where('status', '==', 'open'),
                where('dueDate', '<', today)
            );

            const snapshot = await getAggregateFromServer(q, {
                total: sum('amount'),
                count: sum(1)
            });

            return {
                amount: snapshot.data().total || 0,
                count: snapshot.data().count || 0
            };
        } catch (error) {
            console.warn("Agregação (Payables) falhou. Fallback manual.");
            const allOpen = await payableRepository.findWhere(idTenant, idBranch, [['status', '==', 'open']]);
            const overdue = allOpen.filter(p => moment(p.dueDate?.toDate ? p.dueDate.toDate() : p.dueDate).isBefore(today));
            return {
                amount: overdue.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
                count: overdue.length
            };
        }
    }
}
