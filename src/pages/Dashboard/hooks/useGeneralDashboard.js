import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../../../hooks/useTenant'
import { GeneralDashboardService } from '../../../services/Dashboard/GeneralDashboardService'


// Tipo: 'operational' | 'manager'
export const useGeneralDashboard = (type = 'manager') => {
    const { idTenant, idBranch } = useTenant()

    // Obter userId do localStorage ou contexto Auth (Simplificado aqui)
    // Em produção seria useProfile() ou similar.
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    const userId = authUser?.uid;

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)

    const loadData = useCallback(async () => {
        if (!idTenant || !idBranch) return;

        try {
            setLoading(true);

            if (type === 'operational') {
                if (!userId) throw new Error("Usuário não identificado");
                const res = await GeneralDashboardService.getOperationalData(idTenant, idBranch, userId);
                setData(res);
            } else {
                const res = await GeneralDashboardService.getManagerData(idTenant, idBranch);
                setData(res);
            }

        } catch (error) {
            console.error(`Erro ao carregar dashboard ${type}:`, error);
            // toast.error("Erro ao atualizar dashboard");
        } finally {
            setLoading(false);
        }
    }, [idTenant, idBranch, type, userId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        loading,
        data,
        refresh: loadData
    }
}
