import React, { useRef, useCallback } from "react";
import { useCashFlowList } from "./hooks/useCashFlowList";

// Componentes
import { CashFlowHeader } from "./components/CashFlowHeader";
import { CashFlowFilter } from "./components/CashFlowFilter";
import { CashFlowKPIs } from "./components/CashFlowKPIs";
import { CashFlowChart } from "./components/CashFlowChart";
import { CashFlowTable } from "./components/CashFlowTable";

import "flatpickr/dist/themes/material_blue.css";

const CashFlowPage = () => {
    document.title = "Fluxo de Caixa | PGA Admin";

    const {
        transactions,
        loading,
        period,
        setPeriod,
        customDateRange,
        setCustomDateRange,
        bankAccounts,
        filterBankAccount,
        setFilterBankAccount,
        totals,
        chartData,
        hasMore,
        handleLoadMore
    } = useCashFlowList();

    // Observer Infinite Scroll
    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                handleLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, handleLoadMore]);

    return (
        <React.Fragment>
            {/* 1. Header (Left) + Filter (Right) */}
            {/* O Header e Filter originais eram na mesma linha ou flex row */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <CashFlowHeader />

                {/* 2. Filtros */}
                <CashFlowFilter
                    period={period} setPeriod={setPeriod}
                    customDateRange={customDateRange} setCustomDateRange={setCustomDateRange}
                    bankAccounts={bankAccounts}
                    filterBankAccount={filterBankAccount} setFilterBankAccount={setFilterBankAccount}
                />
            </div>

            {/* 3. KPIs */}
            <CashFlowKPIs totals={totals} />

            {/* 4. Gráfico */}
            <CashFlowChart chartData={chartData} />

            {/* 5. Tabela */}
            <CashFlowTable
                data={transactions}
                loading={loading}
                hasMore={hasMore}
                lastElementRef={lastElementRef}
            />

        </React.Fragment>
    );
};

export default CashFlowPage;
