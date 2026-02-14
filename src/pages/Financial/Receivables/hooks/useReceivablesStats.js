import { useMemo } from 'react';

/**
 * Hook dedicado APENAS ao cálculo de KPIs (Estatísticas) sobre uma lista de dados.
 */
export const useReceivablesStats = (data) => {
    const kpis = useMemo(() => {
        if (!data) return { pending: 0, overdue: 0, received: 0, count: 0, countPending: 0, countOverdue: 0 };

        const totalPending = data
            .filter(r => r.status === 'open' || r.status === 'overdue')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const totalOverdue = data
            .filter(r => r.status === 'overdue')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const totalReceived = data
            .filter(r => r.status === 'paid')
            .reduce((acc, curr) => acc + (parseFloat(curr.amountReceived || curr.amount) || 0), 0);

        return {
            pending: totalPending,
            overdue: totalOverdue,
            received: totalReceived,
            count: data.length,
            countPending: data.filter(r => r.virtualStatus === 'open' || r.virtualStatus === 'overdue').length,
            countOverdue: data.filter(r => r.virtualStatus === 'overdue').length
        };
    }, [data]);

    return kpis;
};
