import { useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useTenant } from '../../../../hooks/useTenant';
import { useAuth } from '../../../../hooks/useAuth';
import { ReceivableService } from '../../../../services/Financial/ReceivableService';

/**
 * Hook responsável exclusivamente pelas ações (mutações) de recebíveis.
 * Segue o princípio de Responsabilidade Única (SRP).
 */
export const useReceivablesActions = ({ onSuccess }) => {
    const { idTenant, idBranch } = useTenant();
    const { user } = useAuth();

    const handleAnticipate = useCallback(async (data, selectedIds, setSelectedIds) => {
        try {
            const auth = getAuth();
            await ReceivableService.anticipateReceivables(idTenant, idBranch, auth.currentUser?.uid, {
                ...data,
                userName: user.displayName || user.email
            });

            toast.success("Antecipação processada com sucesso!");
            if (setSelectedIds) setSelectedIds([]);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro na antecipação:", error);
            toast.error(error.message || "Erro ao processar antecipação.");
        }
    }, [idTenant, idBranch, user, onSuccess]);

    const handleSettle = useCallback(async (settlementData) => {
        try {
            const auth = getAuth();
            await ReceivableService.settleReceivable(idTenant, idBranch, auth.currentUser?.uid, settlementData.id, {
                ...settlementData,
                userName: user.displayName || user.email
            });

            toast.success("Recebimento baixado com sucesso!");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao baixar recebível:", error);
            toast.error(error.message || "Erro ao processar baixa.");
        }
    }, [idTenant, idBranch, user, onSuccess]);

    const handleCancel = useCallback(async (id, reason = "Cancelamento via lista") => {
        try {
            const auth = getAuth();
            await ReceivableService.cancelReceivable(idTenant, idBranch, auth.currentUser?.uid, id, reason);

            toast.success("Título cancelado.");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao cancelar:", error);
            toast.error(error.message || "Erro ao cancelar título.");
        }
    }, [idTenant, idBranch, onSuccess]);

    const handleDelete = useCallback(async (id) => {
        try {
            const auth = getAuth();
            await ReceivableService.deleteReceivable(idTenant, idBranch, auth.currentUser?.uid, id);
            toast.success("Título excluído.");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            toast.error(error.message || "Erro ao excluir título.");
        }
    }, [idTenant, idBranch, onSuccess]);

    return {
        handleAnticipate,
        handleSettle,
        handleCancel,
        handleDelete
    };
};
