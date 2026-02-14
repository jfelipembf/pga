import { useEffect } from 'react';
import { useCashFlowData } from './useCashFlowData';
import { useCashFlowFilter } from './useCashFlowFilter';
import { useCashFlowStats } from './useCashFlowStats';

export const useCashFlowList = () => {
    // 1. Data Hook
    const {
        transactions,
        loading,
        hasMore,
        handleLoadMore,
        loadData,
        setFetchLimit
    } = useCashFlowData();

    // 2. Filter Hook
    const {
        period, setPeriod,
        customDateRange, setCustomDateRange,
        bankAccounts,
        filterBankAccount, setFilterBankAccount,
        dateFilters
    } = useCashFlowFilter(setFetchLimit);

    // 3. Stats Hook (Derived Data)
    const { filteredTransactions, totals, chartData } = useCashFlowStats(transactions, filterBankAccount);

    // Effect: Load data when date filters change
    useEffect(() => {
        loadData(dateFilters);
    }, [loadData, dateFilters]);

    return {
        // Data
        transactions: filteredTransactions, // Return filtered ones for table
        loading,
        hasMore,
        handleLoadMore,

        // Filters
        period, setPeriod,
        customDateRange, setCustomDateRange,
        bankAccounts,
        filterBankAccount, setFilterBankAccount,

        // Stats
        totals,
        chartData,

        // Actions
        refresh: () => loadData(dateFilters)
    };
};
