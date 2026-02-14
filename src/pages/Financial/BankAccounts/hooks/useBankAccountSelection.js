import { useState, useMemo } from 'react';

export const useBankAccountSelection = (accounts) => {
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

    const selectedAccount = useMemo(() => {
        return accounts.find(a => a.id === selectedId) || null;
    }, [accounts, selectedId]);

    const clearSelection = () => {
        setSelectedId(null);
        setIsAddingNew(false);
    };

    return {
        selectedId,
        isAddingNew,
        selectedAccount,
        handleAddClick,
        handleItemClick,
        clearSelection
    };
};
