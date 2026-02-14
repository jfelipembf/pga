import { useState, useCallback, useEffect } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { PayableService } from '../../../../services/Financial/PayableService';
import { toast } from 'react-toastify';

export const usePayablesData = (filters) => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [payables, setPayables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchLimit, setFetchLimit] = useState(50);
    const [hasMore, setHasMore] = useState(false);

    // Reset pagination when filters change
    useEffect(() => {
        setFetchLimit(50);
    }, [filters.status, filters.category, filters.startDate, filters.endDate, filters.searchTerm]);

    const loadPayables = useCallback(async () => {
        if (!isReady) return;

        try {
            setIsLoading(true);

            // Fetch data from service
            const data = await PayableService.listWithFilters(
                idTenant,
                idBranch,
                {
                    status: filters.status,
                    category: filters.category,
                    startDate: filters.startDate,
                    endDate: filters.endDate
                },
                fetchLimit
            );

            setPayables(data);
            setHasMore(data.length >= fetchLimit);

        } catch (error) {
            console.error("Erro ao carregar contas a pagar:", error);
            toast.error("Erro ao carregar contas a pagar");
        } finally {
            setIsLoading(false);
        }
    }, [idTenant, idBranch, isReady, fetchLimit, filters.status, filters.category, filters.startDate, filters.endDate]);

    useEffect(() => {
        loadPayables();
    }, [loadPayables]);

    const handleLoadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            setFetchLimit(prev => prev + 50);
        }
    }, [isLoading, hasMore]);

    return {
        payables,
        isLoading,
        hasMore,
        handleLoadMore,
        refresh: loadPayables
    };
};
