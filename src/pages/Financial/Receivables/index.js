import React, { useState, useRef, useCallback } from 'react';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import { useReceivablesList } from './hooks/useReceivablesList';
import { useReceivablesActions } from './hooks/useReceivablesActions';
import ReceivableSettlementModal from './components/ReceivableSettlementModal';
import ReceivableDetailsModal from './components/ReceivableDetailsModal';
import ReceivableAnticipationModal from './components/ReceivableAnticipationModal';
import { ReceivablesHeader } from './components/ReceivablesHeader';
import { ReceivablesKPIs } from './components/ReceivablesKPIs';
import { ReceivablesFilter } from './components/ReceivablesFilter';
import { ReceivablesTable } from './components/ReceivablesTable';

/**
 * Página de Contas a Receber (Receivables)
 * View Component - Composto por componentes menores e hooks especializados
 */
const ReceivablesPage = () => {
    document.title = "Contas a Receber | PGA Admin";

    // State local para controle dos Modais
    const [selectedReceivable, setSelectedReceivable] = useState(null);
    const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAnticipationModalOpen, setIsAnticipationModalOpen] = useState(false);

    // State para confirmação de cancelamento
    const [receivableToCancel, setReceivableToCancel] = useState(null);
    // State para confirmação de exclusão
    const [receivableToDeleteId, setReceivableToDeleteId] = useState(null);

    const {
        receivables,
        isLoading,
        searchTerm,
        setSearchTerm,
        filteredData,
        kpis,
        handleLoadMore,
        hasMore,
        loadReceivables,
        selectedIds,
        setSelectedIds,
        toggleSelect,
        statusFilter,
        setStatusFilter,
        paymentFilter,
        setPaymentFilter,
        dateRange,
        setDateRange
    } = useReceivablesList();

    const {
        handleSettle,
        handleCancel,
        handleDelete,
        handleAnticipate
    } = useReceivablesActions({
        onSuccess: loadReceivables
    });

    // Observer para Infinite Scroll
    const observer = useRef();
    const lastBookElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                handleLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, handleLoadMore]);

    // Handlers para abrir modais
    const handleOpenSettle = (receivable) => {
        setSelectedReceivable(receivable);
        setIsSettlementModalOpen(true);
    };

    const handleOpenDetails = (receivable) => {
        setSelectedReceivable(receivable);
        setIsDetailsModalOpen(true);
    };

    const handleOpenCancel = (receivable) => {
        setReceivableToCancel(receivable);
    };

    const handleConfirmCancel = () => {
        if (receivableToCancel) {
            handleCancel(receivableToCancel.id);
            setReceivableToCancel(null);
        }
    };

    const handleOpenDelete = (id) => {
        setReceivableToDeleteId(id);
    };

    const handleConfirmDelete = () => {
        if (receivableToDeleteId) {
            handleDelete(receivableToDeleteId);
            setReceivableToDeleteId(null);
        }
    };

    return (
        <React.Fragment>
            <ReceivablesHeader
                selectedIds={selectedIds}
                onAnticipate={() => setIsAnticipationModalOpen(true)}
                clearSelection={() => setSelectedIds([])}
            />

            <ReceivablesKPIs kpis={kpis} />

            <ReceivablesFilter
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter}
                dateRange={dateRange} setDateRange={setDateRange}
                onSearch={loadReceivables}
                isLoading={isLoading}
            />

            <ReceivablesTable
                data={filteredData}
                isLoading={isLoading}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                setSelectedIds={setSelectedIds}
                hasMore={hasMore}
                lastBookElementRef={lastBookElementRef}
                onViewDetails={handleOpenDetails}
                onSettle={handleOpenSettle}
                onCancel={handleOpenCancel}
                onDelete={handleOpenDelete}
                setSearchTerm={setSearchTerm}
                searchTerm={searchTerm}
            />

            {/* MODAIS */}
            {selectedReceivable && (
                <>
                    <ReceivableSettlementModal
                        isOpen={isSettlementModalOpen}
                        toggle={() => setIsSettlementModalOpen(!isSettlementModalOpen)}
                        receivable={selectedReceivable}
                        onSettle={handleSettle}
                    />
                    <ReceivableDetailsModal
                        isOpen={isDetailsModalOpen}
                        toggle={() => setIsDetailsModalOpen(!isDetailsModalOpen)}
                        receivable={selectedReceivable}
                    />
                </>
            )}

            <ReceivableAnticipationModal
                isOpen={isAnticipationModalOpen}
                toggle={() => setIsAnticipationModalOpen(!isAnticipationModalOpen)}
                selectedReceivables={receivables.filter(r => selectedIds.includes(String(r.id)))}
                onAnticipate={(data) => handleAnticipate(data, selectedIds, setSelectedIds)}
            />

            {/* CONFIRM DIALOG - CANCEL */}
            <ConfirmDialog
                isOpen={!!receivableToCancel}
                toggle={() => setReceivableToCancel(null)}
                title="Cancelar Título"
                description={`Atenção: Deseja realmente cancelar o título de ${receivableToCancel?.clientName}? Essa ação reverterá a previsão de receita.`}
                onConfirm={handleConfirmCancel}
                confirmColor="danger"
                confirmText="Sim, Cancelar Título"
                cancelText="Voltar"
            />
            {/* CONFIRM DIALOG - DELETE */}
            <ConfirmDialog
                isOpen={!!receivableToDeleteId}
                toggle={() => setReceivableToDeleteId(null)}
                title="Excluir Título"
                description="Deseja realmente excluir este título? Esta ação não pode ser desfeita."
                onConfirm={handleConfirmDelete}
                confirmColor="danger"
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
            />
        </React.Fragment>
    );
};

export default ReceivablesPage;
