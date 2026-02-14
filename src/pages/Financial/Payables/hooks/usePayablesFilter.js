import { useState } from 'react';

export const usePayablesFilter = () => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [searchTerm, setSearchTerm] = useState('');

    return {
        statusFilter, setStatusFilter,
        categoryFilter, setCategoryFilter,
        dateRange, setDateRange,
        searchTerm, setSearchTerm
    };
};
