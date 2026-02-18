import React, { useEffect, useState } from 'react';
import { useTenant } from '../../hooks/useTenant';
import { useAuth } from '../../hooks/useAuth';
import { CashierService } from '../../services/Financial/CashierService';
import CashierOpenModal from '../../pages/Financial/Cashier/components/CashierOpenModal';
import { toast } from 'react-toastify';

const CashierMonitor = () => {
    const { idTenant, idBranch, isReady } = useTenant();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        if (!isReady || !user || !idTenant || !idBranch || hasChecked) return;

        const checkCashier = async () => {
            // Verifica se já ignorou nesta sessão (opcional, mas bom pra UX)
            // Se o usuário fechar o modal, setHasChecked=true impede de abrir de novo até recarregar a página

            try {
                const status = await CashierService.checkStatus(idTenant, idBranch, user.uid);
                if (!status.isOpen) {
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Erro ao verificar status do caixa:", error);
            } finally {
                setHasChecked(true);
            }
        };

        checkCashier();
    }, [isReady, user, idTenant, idBranch, hasChecked]);

    const toggle = () => setIsOpen(!isOpen);

    const handleOpenCashier = async (values) => {
        try {
            await CashierService.openCashier(
                idTenant,
                idBranch,
                user.uid,
                user.displayName || user.email,
                values.openingBalance
            );
            toast.success("Caixa aberto com sucesso!");
            setIsOpen(false);
            // Poderíamos disparar um evento global ou atualizar contexto se houvesse um CashierContext
        } catch (error) {
            console.error("Erro ao abrir caixa:", error);
            toast.error(error.message || "Erro ao abrir caixa.");
        }
    };

    return (
        <CashierOpenModal
            isOpen={isOpen}
            toggle={toggle}
            onConfirm={handleOpenCashier}
        />
    );
};

export default CashierMonitor;
