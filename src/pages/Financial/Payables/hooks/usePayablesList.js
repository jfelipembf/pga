import { useMemo } from 'react';
import { usePayablesData } from './usePayablesData';
import { usePayablesFilter } from './usePayablesFilter';
import { usePayablesStats } from './usePayablesStats';
import { usePayablesActions } from './usePayablesActions';

export const usePayablesList = () => {
    // 1. Setup Filters
    const {
        statusFilter, setStatusFilter,
        categoryFilter, setCategoryFilter,
        dateRange, setDateRange,
        searchTerm, setSearchTerm
    } = usePayablesFilter();

    // 2. Fetch Data (Backend filters applied here)
    const filters = useMemo(() => ({
        status: statusFilter,
        category: categoryFilter,
        startDate: dateRange.start,
        endDate: dateRange.end,
        searchTerm // Also passing search term if needed by fetcher/effect
    }), [statusFilter, categoryFilter, dateRange, searchTerm]);

    const {
        payables,
        isLoading,
        hasMore,
        handleLoadMore,
        refresh
    } = usePayablesData(filters);

    // 3. Client-side Search Filtering (Refinement)
    const filteredPayables = useMemo(() => {
        if (!searchTerm) return payables;
        const lowerTerm = searchTerm.toLowerCase();
        return payables.filter(item => {
            const description = item.description || item.title || '';
            const supplier = item.supplier || '';
            return description.toLowerCase().includes(lowerTerm) ||
                supplier.toLowerCase().includes(lowerTerm);
        });
    }, [payables, searchTerm]);

    // 4. Stats
    const stats = usePayablesStats(payables);

    // 5. Actions
    const {
        handleCreate,
        handleUpdate,
        handlePay,
        handleDelete
    } = usePayablesActions({ onSuccess: refresh });

    return {
        // Data
        payables,
        filteredPayables,
        isLoading,
        hasMore,
        handleLoadMore,
        refresh,

        // Filters
        statusFilter, setStatusFilter,
        categoryFilter, setCategoryFilter,
        dateRange, setDateRange,
        searchTerm, setSearchTerm,

        // Stats
        totals: stats,

        // Actions
        handleCreate,
        handleUpdate,
        handlePay,
        handleDelete
    };
};
