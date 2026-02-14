import { useCallback } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { useAuth } from '../../../../hooks/useAuth';
import { PayableService } from '../../../../services/Financial/PayableService';
import { toast } from 'react-toastify';

export const usePayablesActions = ({ onSuccess }) => {
    const { idTenant, idBranch } = useTenant();
    const { user } = useAuth();

    const handleCreate = useCallback(async (data) => {
        try {
            await PayableService.createPayable(idTenant, idBranch, user.uid, {
                ...data,
                userName: user.displayName || user.email
            });
            toast.success("Despesa criada com sucesso!");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao criar despesa:", error);
            toast.error(error.message || "Erro ao criar despesa");
        }
    }, [idTenant, idBranch, user, onSuccess]);

    const handleUpdate = useCallback(async (id, data) => {
        try {
            await PayableService.updatePayable(idTenant, idBranch, user.uid, id, {
                ...data,
                userName: user.displayName || user.email
            });
            toast.success("Despesa atualizada com sucesso!");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao atualizar despesa:", error);
            toast.error(error.message || "Erro ao atualizar despesa");
        }
    }, [idTenant, idBranch, user, onSuccess]);

    const handlePay = useCallback(async (id, paymentData) => {
        try {
            await PayableService.payBill(idTenant, idBranch, user.uid, id, {
                ...paymentData,
                userName: user.displayName || user.email
            });
            toast.success("Pagamento realizado com sucesso!");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao pagar despesa:", error);
            toast.error(error.message || "Erro ao pagar despesa");
        }
    }, [idTenant, idBranch, user, onSuccess]);

    const handleDelete = useCallback(async (id) => {
        try {
            await PayableService.deletePayable(idTenant, idBranch, user.uid, id);
            toast.success("Despesa excluída com sucesso!");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao excluir despesa:", error);
            toast.error(error.message || "Erro ao excluir despesa");
        }
    }, [idTenant, idBranch, user, onSuccess]);

    return {
        handleCreate,
        handleUpdate,
        handlePay,
        handleDelete
    };
};
