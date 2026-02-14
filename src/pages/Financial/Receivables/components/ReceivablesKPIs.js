import React from 'react';
import Miniwidget from '../../../Dashboard/Miniwidget';
import { formatCurrency } from '../../../../utils/format';

export const ReceivablesKPIs = ({ kpis }) => {
    return (
        <Miniwidget
            colSize={4}
            reports={[
                { title: "A Receber", iconClass: "clock-outline", total: formatCurrency(kpis?.pending || 0), average: `${kpis?.countPending || 0} parcelas`, badgecolor: "warning" },
                { title: "Em Atraso", iconClass: "alert-circle-outline", total: formatCurrency(kpis?.overdue || 0), average: `${kpis?.countOverdue || 0} parcelas`, badgecolor: "danger" },
                { title: "Recebido", iconClass: "check-circle-outline", total: formatCurrency(kpis?.received || 0), average: "Valor líquido", badgecolor: "success" },
            ]}
        />
    );
};
