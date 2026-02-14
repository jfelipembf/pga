import { useState, useCallback, useEffect } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { BankAccountService } from '../../../../services/Financial/BankAccountService';
import { toast } from 'react-toastify';

export const useBankAccountData = () => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAccounts = useCallback(async () => {
        if (!isReady || !idTenant || !idBranch) return;

        try {
            setLoading(true);
            const data = await BankAccountService.listAll(idTenant, idBranch);
            setAccounts(data);
        } catch (error) {
            console.error("Erro ao carregar contas bancárias:", error);
            toast.error("Erro ao carregar contas");
        } finally {
            setLoading(false);
        }
    }, [idTenant, idBranch, isReady]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    return {
        accounts,
        loading,
        refresh: loadAccounts
    };
};
