import { useState, useCallback } from 'react';
import moment from 'moment';
import { useReceivablesData } from './useReceivablesData';
import { useReceivablesFilter } from './useReceivablesFilter';
import { useReceivablesStats } from './useReceivablesStats';

/**
 * Hook "Container" (Facade) que compõe os hooks especializados.
 * Mantém a API original para não quebrar a página, mas delega as responsabilidades.
 */
export const useReceivablesList = () => {
    // 1. Estado de Paginação e Data (Controlam o Fetch)
    const [fetchLimit, setFetchLimit] = useState(50);
    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().endOf('month').format('YYYY-MM-DD')
    });

    // 2. Estado de Seleção (UI apenas)
    const [selectedIds, setSelectedIds] = useState([]);

    // 3. Composição dos Hooks Especializados
    const { data: receivables, isLoading, loadReceivables } = useReceivablesData(dateRange, fetchLimit);

    const {
        filteredData,
        statusFilter, setStatusFilter,
        paymentFilter, setPaymentFilter,
        searchTerm, setSearchTerm
    } = useReceivablesFilter(receivables);

    const kpis = useReceivablesStats(filteredData);

    // 4. Helpers de UI
    const handleLoadMore = useCallback(() => {
        setFetchLimit(prev => prev + 50);
    }, []);

    const toggleSelect = useCallback((id) => {
        const idStr = String(id);
        setSelectedIds(prev =>
            prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
        );
    }, []);

    return {
        // Data & Status
        receivables,
        isLoading,
        filteredData,
        kpis,
        hasMore: receivables.length === fetchLimit,
        loadReceivables,
        handleLoadMore,

        // Filters State
        statusFilter, setStatusFilter,
        paymentFilter, setPaymentFilter,
        searchTerm, setSearchTerm,
        dateRange, setDateRange,

        // Selection State
        selectedIds, setSelectedIds,
        toggleSelect
    };
};
