import React from 'react';
import Miniwidget from "../../../Dashboard/Miniwidget";
import { formatCurrency } from '../../../../utils/format';

export const PayablesKPIs = ({ totals }) => {
    return (
        <Miniwidget
            colSize={4}
            reports={[
                { title: "A Vencer", iconClass: "clock-outline", total: formatCurrency(totals.totalPending), average: `${totals.countPending} contas`, badgecolor: "warning" },
                { title: "Em Atraso", iconClass: "alert-circle-outline", total: formatCurrency(totals.totalOverdue), average: `${totals.countOverdue} contas`, badgecolor: "danger" },
                { title: "Pago no Mês", iconClass: "check-circle-outline", total: formatCurrency(totals.totalPaid), average: "Fluxo", badgecolor: "success" },
            ]}
        />
    );
};
