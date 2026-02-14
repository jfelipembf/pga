
import { useCallback } from 'react';
import { AcquirerService } from '../../../../services/Financial/AcquirerService';
import { toast } from 'react-toastify';
import { useTenant } from '../../../../hooks/useTenant';

export const useAcquirerOperations = ({ onSuccess }) => {
    const { idTenant, idBranch } = useTenant();

    const saveAcquirer = useCallback(async (data, selectedId) => {
        try {
            const authUser = JSON.parse(localStorage.getItem("authUser"));
            const userId = authUser?.uid || authUser?.email || "unknown_user";

            let savedId = selectedId;

            if (selectedId) {
                await AcquirerService.update(idTenant, idBranch, userId, selectedId, data);
                toast.success("Adquirente atualizada com sucesso");
            } else {
                const newAcquirer = await AcquirerService.createAcquirer(idTenant, idBranch, userId, data);
                savedId = newAcquirer.id;
                toast.success("Adquirente cadastrada com sucesso");
            }

            if (onSuccess) onSuccess(savedId);
            return savedId;
        } catch (error) {
            console.error("Erro ao salvar adquirente:", error);
            toast.error(error.message || "Erro ao salvar adquirente");
            return null;
        }
    }, [idTenant, idBranch, onSuccess]);

    return {
        saveAcquirer
    };
};
