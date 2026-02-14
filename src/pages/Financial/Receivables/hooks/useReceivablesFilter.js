import { useState, useMemo } from 'react';


/**
 * Hook dedicado APENAS à lógica de filtragem local dos dados.
 */
export const useReceivablesFilter = (receivables) => {
    const [statusFilter, setStatusFilter] = useState('open');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");

    // A filtragem de data já ocorre no servidor (useReceivablesData), 
    // mas mantemos o estado aqui se quiser filtrar localmente também.
    // Para simplificar, vou assumir que a data é tratada no data hook, 
    // e aqui filtramos o restante.

    const filteredData = useMemo(() => {
        if (!receivables) return [];

        return receivables.filter(r => {
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

            // 3. Filtro de Busca Textual
            const term = searchTerm?.toLowerCase() || '';
            const matchesSearch = !term ||
                (r.clientName?.toLowerCase().includes(term)) ||
                (String(r.saleNumber).includes(term)) ||
                (r.description?.toLowerCase().includes(term));

            return matchesStatus && matchesPayment && matchesSearch;
        });
    }, [receivables, statusFilter, paymentFilter, searchTerm]);

    return {
        filteredData,
        statusFilter, setStatusFilter,
        paymentFilter, setPaymentFilter,
        searchTerm, setSearchTerm
    };
};
