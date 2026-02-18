import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../../hooks/useTenant';
import { AreaService } from '../../../services/Admin/AreaService';

/**
 * Hook para carregar áreas (piscinas) disponíveis para o planejamento de treinos.
 * Filtra apenas áreas ativas e que possuam comprimento (length) definido,
 * pois se a área tem comprimento, é uma piscina.
 */
export const usePoolAreas = () => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadPools = useCallback(async () => {
        if (!isReady) return;

        try {
            setLoading(true);
            const allAreas = await AreaService.listAreas(idTenant, idBranch);

            // Filtra áreas que possuem comprimento (piscinas)
            const poolAreas = allAreas
                .filter(a => a.isActive !== false && a.length > 0)
                .map(a => ({
                    id: a.id,
                    name: a.name,
                    width: Number(a.width) || 0,
                    length: Number(a.length) || 0,
                    capacity: Number(a.capacity) || 0,
                    photo: a.photo || null,
                }));

            setPools(poolAreas);
        } catch (error) {
            console.error("[usePoolAreas] Erro ao carregar piscinas:", error);
        } finally {
            setLoading(false);
        }
    }, [idTenant, idBranch, isReady]);

    useEffect(() => {
        loadPools();
    }, [loadPools]);

    return { pools, loading };
};
