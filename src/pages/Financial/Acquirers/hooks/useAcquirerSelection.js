
import { useState, useMemo } from 'react';

export const useAcquirerSelection = (acquirers) => {
    const [selectedId, setSelectedId] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const handleAddClick = () => {
        setIsAddingNew(true);
        setSelectedId(null);
    };

    const handleItemClick = (item) => {
        setSelectedId(item.id);
        setIsAddingNew(false);
    };

    const selectedAcquirer = useMemo(() => {
        return acquirers.find(a => a.id === selectedId) || null;
    }, [acquirers, selectedId]);

    const clearSelection = () => {
        setSelectedId(null);
        setIsAddingNew(false);
    }

    // Helper to keep selection after save
    const setSelectionById = (id) => {
        setSelectedId(id);
        setIsAddingNew(false);
    }

    return {
        selectedId,
        isAddingNew,
        selectedAcquirer,
        handleAddClick,
        handleItemClick,
        clearSelection,
        setSelectionById
    };
};
