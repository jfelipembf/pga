import { useMemo } from 'react';

export const usePayablesStats = (payables) => {
    const stats = useMemo(() => {
        const pending = payables.filter(p => p.status === 'open');
        const overdue = payables.filter(p => p.status === 'overdue');
        const paid = payables.filter(p => p.status === 'paid');

        return {
            totalPending: pending.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
            countPending: pending.length,

            totalOverdue: overdue.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
            countOverdue: overdue.length,

            totalPaid: paid.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0),
            countPaid: paid.length
        };
    }, [payables]);

    return stats;
};
