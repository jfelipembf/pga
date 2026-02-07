import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTenant } from '../../../../hooks/useTenant'; // Importe o hook padronizado
import { ReceivableService } from '../../../../services/Financial/ReceivableService';
import { toast } from 'react-toastify';
import moment from 'moment';
import { getAuth } from 'firebase/auth';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';

/**
 * Hook centralizado para gerenciar a lista de recebíveis, filtros e ações.
 */
export const useReceivablesList = () => {
    // PADRÃO: Usar hook centralizado para evitar inconsistência de IDs
    const { idTenant, idBranch, isReady } = useTenant();

    const user = useCurrentUser();

    // 1. Estados Principais
    const [receivables, setReceivables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    // Filtros
    const [statusFilter, setStatusFilter] = useState('open');
    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().endOf('month').format('YYYY-MM-DD')
    });
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [fetchLimit, setFetchLimit] = useState(50);

    // 2. Carregar Dados do Servidor (Otimizado)
    const loadReceivables = useCallback(async () => {
        if (!isReady) return;
        if (!idTenant || !idBranch) return;
        try {
            setIsLoading(true);

            const receivablesData = await ReceivableService.listAll(idTenant, idBranch, {
                startDate: dateRange.start,
                endDate: dateRange.end,
                limit: fetchLimit
            });

            const today = moment().startOf('day');

            // Processar dados para identificar atrasos dinamicamente
            const processed = receivablesData.map(r => {
                const dueDate = r.dueDate?.seconds ? moment(r.dueDate.seconds * 1000) : moment(r.dueDate);
                const isOverdue = r.status === 'open' && dueDate.isValid() && dueDate.isBefore(today, 'day');

                return {
                    ...r,
                    isOverdue,
                    virtualStatus: isOverdue ? 'overdue' : r.status
                };
            });

            setReceivables(processed);
        } catch (error) {
            console.error("Erro ao carregar recebíveis:", error);
            toast.error("Erro ao sincronizar dados.");
        } finally {
            setIsLoading(false);
        }
    }, [idTenant, idBranch, fetchLimit, dateRange, isReady]);

    const handleLoadMore = useCallback(() => {
        setFetchLimit(prev => prev + 50);
    }, []);

    // Reset fetchLimit ao mudar filtros
    useEffect(() => {
        setFetchLimit(50);
    }, [statusFilter, paymentFilter, dateRange]);

    // Carregar dados quando houver mudanças (Filtros ou Tenant)
    useEffect(() => {
        loadReceivables();
    }, [loadReceivables]);

    // 3. Lógica de Seleção
    const toggleSelect = useCallback((id) => {
        const idStr = String(id);
        setSelectedIds(prev =>
            prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
        );
    }, []);

    // 4. Dados Filtrados
    const filteredData = useMemo(() => {
        const res = receivables.filter(r => {
            // 1. Filtro de Status
            let matchesStatus = true;
            if (statusFilter !== 'all') {
                if (statusFilter === 'open') {
                    matchesStatus = r.virtualStatus === 'open';
                } else if (statusFilter === 'overdue') {
                    matchesStatus = r.virtualStatus === 'overdue';
                } else {
                    matchesStatus = r.status === statusFilter;
                }
            }

            // 2. Filtro de Pagamento
            const matchesPayment = paymentFilter === 'all' || r.paymentMethod === paymentFilter;

            // 3. Filtro de Data (Cliente)
            let matchesDate = true;
            if (dateRange.start && dateRange.end) {
                const rDate = r.dueDate?.seconds ? moment(r.dueDate.seconds * 1000) : moment(r.dueDate);
                const start = moment(dateRange.start).startOf('day');
                const end = moment(dateRange.end).endOf('day');
                matchesDate = rDate.isValid() && rDate.isBetween(start, end, null, '[]');
            }

            // 4. Filtros de busca textual
            const term = searchTerm?.toLowerCase() || '';
            const matchesSearch = !term ||
                (r.clientName?.toLowerCase().includes(term)) ||
                (String(r.saleNumber).includes(term)) ||
                (r.description?.toLowerCase().includes(term));

            return matchesStatus && matchesPayment && matchesSearch && matchesDate;
        });
        return res;
    }, [receivables, searchTerm, statusFilter, paymentFilter, dateRange]);

    // 5. KPIs Totais
    const kpis = useMemo(() => {
        const totalPending = filteredData
            .filter(r => r.status === 'open' || r.status === 'overdue')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const totalOverdue = filteredData
            .filter(r => r.status === 'overdue')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const totalReceived = filteredData
            .filter(r => r.status === 'paid')
            .reduce((acc, curr) => acc + (parseFloat(curr.amountReceived || curr.amount) || 0), 0);

        return {
            pending: totalPending,
            overdue: totalOverdue,
            received: totalReceived,
            count: filteredData.length,
            countPending: filteredData.filter(r => r.virtualStatus === 'open' || r.virtualStatus === 'overdue').length,
            countOverdue: filteredData.filter(r => r.virtualStatus === 'overdue').length
        };
    }, [filteredData]);

    /**
     * Lógica de Antecipação de Recebíveis (Bulk)
     */
    const handleAnticipate = async (data) => {
        try {
            const auth = getAuth();
            await ReceivableService.anticipateReceivables(idTenant, idBranch, auth.currentUser?.uid, {
                ...data,
                userName: user.displayName || user.email
            });

            toast.success("Antecipação processada com sucesso!");
            setSelectedIds([]);
            loadReceivables();
        } catch (error) {
            console.error("Erro na antecipação:", error);
            toast.error(error.message || "Erro ao processar antecipação.");
        }
    };

    const handleSettle = async (settlementData) => {
        try {
            const auth = getAuth();
            await ReceivableService.settleReceivable(idTenant, idBranch, auth.currentUser?.uid, settlementData.id, {
                ...settlementData,
                userName: user.displayName || user.email
            });

            toast.success("Recebimento baixado com sucesso!");
            loadReceivables();
        } catch (error) {
            console.error("Erro ao baixar recebível:", error);
            toast.error(error.message || "Erro ao processar baixa.");
        }
    };

    const handleCancel = async (id, reason = "Cancelamento via lista") => {
        try {
            const auth = getAuth();
            await ReceivableService.cancelReceivable(idTenant, idBranch, auth.currentUser?.uid, id, reason);

            toast.success("Título cancelado.");
            loadReceivables();
        } catch (error) {
            console.error("Erro ao cancelar:", error);
            toast.error(error.message || "Erro ao cancelar título.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir este título? Isso não poderá ser desfeito se não houver histórico.")) return;
        try {
            const auth = getAuth();
            await ReceivableService.deleteReceivable(idTenant, idBranch, auth.currentUser?.uid, id);
            toast.success("Título excluído.");
            loadReceivables();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            toast.error(error.message || "Erro ao excluir título.");
        }
    }

    return {
        receivables,
        isLoading,
        filteredData,
        kpis,
        selectedIds,
        setSelectedIds,
        statusFilter,
        setStatusFilter,
        dateRange,
        setDateRange,
        paymentFilter,
        setPaymentFilter,
        searchTerm,
        setSearchTerm,
        toggleSelect,
        handleAnticipate,
        handleSettle,
        handleCancel,
        handleDelete,
        handleLoadMore,
        loadReceivables,
        hasMore: receivables.length === fetchLimit
    };
};
