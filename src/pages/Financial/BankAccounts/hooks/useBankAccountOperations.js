import { useCallback } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { useAuth } from '../../../../hooks/useAuth';
import { BankAccountService } from '../../../../services/Financial/BankAccountService';
import { toast } from 'react-toastify';

export const useBankAccountOperations = ({ onSuccess }) => {
    const { idTenant, idBranch } = useTenant();
    const { user } = useAuth();

    const createAccount = useCallback(async (data) => {
        try {
            await BankAccountService.createAccount(idTenant, idBranch, user.uid, data);
            toast.success("Conta cadastrada com sucesso");
            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            console.error("Erro ao criar conta:", error);
            toast.error(error.message || "Erro ao criar conta");
            return false;
        }
    }, [idTenant, idBranch, user.uid, onSuccess]);

    const updateAccount = useCallback(async (id, data) => {
        try {
            await BankAccountService.update(idTenant, idBranch, user.uid, id, data);
            toast.success("Conta atualizada com sucesso");
            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            console.error("Erro ao atualizar conta:", error);
            toast.error(error.message || "Erro ao atualizar conta");
            return false;
        }
    }, [idTenant, idBranch, user.uid, onSuccess]);

    const deleteAccount = useCallback(async (id) => {
        try {
            await BankAccountService.delete(idTenant, idBranch, user.uid, id);
            toast.success("Conta excluída com sucesso");
            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            toast.error("Erro ao excluir conta");
            return false;
        }
    }, [idTenant, idBranch, user.uid, onSuccess]);

    return {
        createAccount,
        updateAccount,
        deleteAccount
    };
};
