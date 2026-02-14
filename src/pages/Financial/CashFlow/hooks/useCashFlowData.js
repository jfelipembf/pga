import { useState, useCallback } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { CashierService } from '../../../../services/Financial/CashierService';
import { toast } from 'react-toastify';

export const useCashFlowData = () => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchLimit, setFetchLimit] = useState(50);
    const [hasMore, setHasMore] = useState(true);

    const loadData = useCallback(async (filters) => {
        if (!isReady || !idTenant || !idBranch) return;

        try {
            setLoading(true);

            // Carrega transações com os filtros de data aplicados e limite
            const txs = await CashierService.listTransactions(
                idTenant,
                idBranch,
                filters,
                fetchLimit
            );

            // Verifica se há mais dados para carregar
            if (txs.length < fetchLimit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setTransactions(txs);
        } catch (error) {
            console.error("Erro ao carregar fluxo de caixa:", error);
            toast.error("Erro ao carregar dados financeiros");
        } finally {
            setLoading(false);
        }
    }, [idTenant, idBranch, isReady, fetchLimit]);

    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            setFetchLimit(prev => prev + 50);
        }
    }, [loading, hasMore]);

    return {
        transactions,
        loading: loading || !isReady,
        hasMore,
        handleLoadMore,
        loadData,
        setFetchLimit // expor se necessário resetar
    };
};
