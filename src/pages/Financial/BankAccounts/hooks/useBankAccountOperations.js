import { useCallback } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { BankAccountService } from '../../../../services/Financial/BankAccountService';
import { toast } from 'react-toastify';

export const useBankAccountOperations = ({ onSuccess }) => {
    const { idTenant, idBranch } = useTenant();

    const createAccount = useCallback(async (data) => {
        try {
            await BankAccountService.createAccount(idTenant, idBranch, data);
            toast.success("Conta cadastrada com sucesso");
            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            console.error("Erro ao criar conta:", error);
            toast.error(error.message || "Erro ao criar conta");
            return false;
        }
    }, [idTenant, idBranch, onSuccess]);

    const updateAccount = useCallback(async (id, data) => {
        try {
            await BankAccountService.update(idTenant, idBranch, id, data);
            toast.success("Conta atualizada com sucesso");
            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            console.error("Erro ao atualizar conta:", error);
            toast.error(error.message || "Erro ao atualizar conta");
            return false;
        }
    }, [idTenant, idBranch, onSuccess]);

    const deleteAccount = useCallback(async (id) => {
        try {
            await BankAccountService.delete(idTenant, idBranch, id);
            toast.success("Conta excluída com sucesso");
            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            toast.error("Erro ao excluir conta");
            return false;
        }
    }, [idTenant, idBranch, onSuccess]);

    return {
        createAccount,
        updateAccount,
        deleteAccount
    };
};
