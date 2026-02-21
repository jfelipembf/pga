import { CLIENT_CONTRACT_STATUS } from "../../../utils/constants";

/**
 * Regras de domínio para os Dashboards
 */
export const DashboardRules = {

    /**
     * Calcula o crescimento percentual entre dois valores
     */
    calculateGrowth: (current, previous) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    },

    /**
     * Calcula uma taxa percentual simples (ex: conversão)
     */
    calculateRate: (value, total) => {
        if (!total || total === 0) return 0;
        return (value / total) * 100;
    },

    /**
     * Retorna a configuração de label e cor para o status de um contrato
     * Resolve expiração automática se o status for 'active' mas a data final já passou.
     */
    getContractStatusConfig: (status, endDate) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let realStatus = status || 'pending';

        // Se está como ativo mas o prazo venceu, o status real é expirado
        if (realStatus === CLIENT_CONTRACT_STATUS.ACTIVE && endDate && endDate < now) {
            realStatus = 'expired';
        }

        const statusMap = {
            [CLIENT_CONTRACT_STATUS.ACTIVE]: { label: 'Ativo', color: 'success' },
            [CLIENT_CONTRACT_STATUS.CANCELLED]: { label: 'Cancelado', color: 'danger' },
            'canceled': { label: 'Cancelado', color: 'danger' },
            'expired': { label: 'Expirado', color: 'dark' },
            [CLIENT_CONTRACT_STATUS.SUSPENDED]: { label: 'Suspenso', color: 'secondary' },
            'pending': { label: 'Pendente', color: 'warning' },
            [CLIENT_CONTRACT_STATUS.SCHEDULED_CANCELLATION]: { label: 'Cancel. Agendado', color: 'info' }
        };

        return statusMap[realStatus] || { label: 'Pendente', color: 'warning' };
    },

    /**
     * Helper para mapear um índice de mês (ago-0, set-1...) baseado em uma data
     * Útil para gráficos de 12 meses
     */
    getMonthIndex: (date, referenceDate = new Date()) => {
        const monthDiff = (referenceDate.getFullYear() - date.getFullYear()) * 12 + (referenceDate.getMonth() - date.getMonth());
        return 11 - monthDiff;
    }
};
