import { useMemo } from 'react';
import moment from 'moment';

export const useCashFlowStats = (transactions, filterBankAccount) => {

    // Filtragem Client-Side por Conta Bancária
    const filteredTransactions = useMemo(() => {
        if (filterBankAccount === 'all') return transactions;
        return transactions.filter(t => t.idBankAccount === filterBankAccount);
    }, [transactions, filterBankAccount]);

    // Totais (Entradas, Saídas, Saldo)
    const totals = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, curr) => acc + (parseFloat(curr.netAmount || curr.amount) || 0), 0);

        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        return {
            income,
            expense,
            balance: income - expense
        };
    }, [filteredTransactions]);

    // Dados para o Gráfico (Agrupado por dia - últimos 7 dias fixos ou baseado nos filtrados?)
    // O gráfico anterior fixava "Últimos 7 dias". Vamos manter a lógica ou adaptar ao filtro?
    // O original fazia "last7Days" fixo, mas usava "filteredTransactions".
    // Se o filtro for "month", mostrar 7 dias pode ser estranho, mas vamos manter a lógica original por enquanto para não quebrar funcionalidade.
    // Melhoria: Se o período for maior que 7 dias, mostra 7 dias? Ou mostra o período?
    // O original DIZIA "Últimos 7 dias" no título. Vamos manter assim para consistência visual imediata.

    const chartData = useMemo(() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            last7Days.push(moment().subtract(i, 'days').format('DD/MM'));
        }

        const entries = new Array(7).fill(0);
        const exits = new Array(7).fill(0);

        filteredTransactions.forEach(t => {
            const dateStr = moment(t.date?.toDate ? t.date.toDate() : t.date).format('DD/MM');
            const index = last7Days.indexOf(dateStr);
            if (index !== -1) {
                if (t.type === 'income') entries[index] += parseFloat(t.netAmount || t.amount) || 0;
                else exits[index] += parseFloat(t.amount) || 0;
            }
        });

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
        };
    }, [filteredTransactions]);

    return {
        filteredTransactions,
        totals,
        chartData
    };
};
