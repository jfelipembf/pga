import { useState, useCallback, useEffect } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { ReceivableService } from '../../../../services/Financial/ReceivableService';
import { toast } from 'react-toastify';
import moment from 'moment';

/**
 * Hook dedicado APENAS ao gerenciamento de busca de dados do servidor (Data Fetching).
 */
export const useReceivablesData = (dateRange, fetchLimit) => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadReceivables = useCallback(async () => {
        if (!isReady || !idTenant || !idBranch) return;

        try {
            setIsLoading(true);
            const receivablesData = await ReceivableService.listAll(idTenant, idBranch, {
                startDate: dateRange.start,
                endDate: dateRange.end,
                limit: fetchLimit
            });

            // Processamento leve de dados (ex: identificar atrasos)
            const today = moment().startOf('day');
            const processed = receivablesData.map(r => {
                const dueDate = r.dueDate?.seconds ? moment(r.dueDate.seconds * 1000) : moment(r.dueDate);
                const isOverdue = r.status === 'open' && dueDate.isValid() && dueDate.isBefore(today, 'day');

                return {
                    ...r,
                    isOverdue,
                    virtualStatus: isOverdue ? 'overdue' : r.status
                };
            });

            setData(processed);
        } catch (error) {
            console.error("Erro ao carregar recebíveis:", error);
            toast.error("Erro ao sincronizar dados.");
        } finally {
            setIsLoading(false);
        }
    }, [idTenant, idBranch, isReady, dateRange, fetchLimit]);

    // Carregar automaticamente quando dependências mudarem
    useEffect(() => {
        loadReceivables();
    }, [loadReceivables]);

    return { data, isLoading, loadReceivables };
};
