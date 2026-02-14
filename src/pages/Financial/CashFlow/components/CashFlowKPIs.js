import React from 'react';
import Miniwidget from "../../../Dashboard/Miniwidget";
import { formatCurrency } from '../../../../utils/format';

export const CashFlowKPIs = ({ totals }) => {
    return (
        <Miniwidget
            colSize={4}
            reports={[
                { title: "Entradas", iconClass: "arrow-up-bold", total: formatCurrency(totals.income), average: "No período", badgecolor: "success" },
                { title: "Saídas", iconClass: "arrow-down-bold", total: formatCurrency(totals.expense), average: "No período", badgecolor: "danger" },
                { title: "Saldo Líquido", iconClass: "scale-balance", total: formatCurrency(totals.balance), average: "Resultado", badgecolor: "info" },
            ]}
        />
    );
};
