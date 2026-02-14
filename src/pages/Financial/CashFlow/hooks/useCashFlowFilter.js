import { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import { useTenant } from '../../../../hooks/useTenant';
import { BankAccountService } from '../../../../services/Financial/BankAccountService';

export const useCashFlowFilter = (setFetchLimit) => {
    const { idTenant, idBranch } = useTenant();

    // Período
    const [period, setPeriod] = useState('month');
    const [customDateRange, setCustomDateRange] = useState({ start: new Date(), end: new Date() });

    // Filtros de Conta
    const [bankAccounts, setBankAccounts] = useState([]);
    const [filterBankAccount, setFilterBankAccount] = useState('all');

    // Carregar Contas Bancárias
    useEffect(() => {
        if (idTenant && idBranch) {
            BankAccountService.listActive(idTenant, idBranch)
                .then(setBankAccounts)
                .catch(err => console.error("Erro ao carregar contas bancárias:", err));
        }
    }, [idTenant, idBranch]);

    // Calcular datas de filtro baseado no período
    const dateFilters = useMemo(() => {
        let start, end;

        if (period === 'day') {
            start = moment().startOf('day');
            end = moment().endOf('day');
        } else if (period === 'week') {
            start = moment().subtract(6, 'days').startOf('day'); // Últimos 7 dias
            end = moment().endOf('day');
        } else if (period === 'month') {
            start = moment().startOf('month');
            end = moment().endOf('month');
        } else if (period === 'custom') {
            start = moment(customDateRange.start).startOf('day');
            end = moment(customDateRange.end).endOf('day');
        } else {
            // Default month
            start = moment().startOf('month');
            end = moment().endOf('month');
        }

        return {
            startDate: start.toDate(),
            endDate: end.toDate()
        };
    }, [period, customDateRange]);

    // Reset pagination when filters change
    useEffect(() => {
        if (setFetchLimit) setFetchLimit(50);
    }, [period, customDateRange, filterBankAccount, setFetchLimit]);

    return {
        period, setPeriod,
        customDateRange, setCustomDateRange,
        bankAccounts,
        filterBankAccount, setFilterBankAccount,
        dateFilters
    };
};
