import React, { useState, useRef, useCallback } from "react";
import { usePayablesList } from "./hooks/usePayablesList";

// Componentes
import { PayablesHeader } from "./components/PayablesHeader";
import { PayablesKPIs } from "./components/PayablesKPIs";
import { PayablesFilter } from "./components/PayablesFilter";
import { PayablesTable } from "./components/PayablesTable";
import { PayableFormVisual } from "./components/PayableFormVisual";
import PayablePaymentModal from "./components/PayablePaymentModal";
import GenericModal from "../../../components/Common/GenericModal";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";

const PayablesPage = () => {
    document.title = "Contas a Pagar | PGA Admin";

    // 1. Hooks (Estado e Lógica Orquestrada)
    const {
        payables,
        filteredPayables,
        totals, // stats
        isLoading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        dateRange,
        setDateRange,
        handleCreate,
        handleUpdate,
        handlePay,
        handleDelete,
        hasMore,
        handleLoadMore
    } = usePayablesList();

    // 2. Estado Local (Modais e Interações)
    const [modal, setModal] = useState(false);
    const [selectedPayable, setSelectedPayable] = useState(null);
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedPayableForPayment, setSelectedPayableForPayment] = useState(null);
    const [payableToDeleteId, setPayableToDeleteId] = useState(null);

    // Observer Infinite Scroll
    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                handleLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, handleLoadMore]);

    // Categories Derived (Moved to Hook or keep here if purely visual)
    const categories = React.useMemo(() => Array.from(new Set(payables.map(p => p.category || 'Geral'))), [payables]);

    // Handlers
    const toggleModal = () => {
        setModal(!modal);
        if (modal) setSelectedPayable(null);
    };

    const handleEdit = (item) => {
        setSelectedPayable(item);
        setModal(true);
    };

    const handleSave = async (data) => {
        if (selectedPayable) {
            await handleUpdate(selectedPayable.id, data);
        } else {
            await handleCreate(data);
        }
        toggleModal();
    };

    const openPaymentModal = (payable) => {
        setSelectedPayableForPayment(payable);
        setPaymentModal(true);
    };

    const handlePaymentConfirm = async (paymentData) => {
        await handlePay(paymentData.id, paymentData);
        setPaymentModal(false);
    };

    const handleOpenDelete = (id) => {
        setPayableToDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (payableToDeleteId) {
            await handleDelete(payableToDeleteId);
            setPayableToDeleteId(null);
        }
    };

    return (
        <React.Fragment>
            {/* Header */}
            <PayablesHeader onNewClick={toggleModal} />

            {/* KPIs */}
            <PayablesKPIs totals={totals} />

            {/* Filter */}
            <PayablesFilter
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                dateRange={dateRange} setDateRange={setDateRange}
                categories={categories}
                isLoading={isLoading}
            />

            {/* Table */}
            <PayablesTable
                data={filteredPayables}
                loading={isLoading}
                hasMore={hasMore}
                lastElementRef={lastElementRef}
                onEdit={handleEdit}
                onPay={openPaymentModal}
                onDelete={handleOpenDelete}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            {/* Modals */}
            <GenericModal
                isOpen={modal}
                toggle={toggleModal}
                size="lg"
                title={selectedPayable ? "Editar Despesa" : "Nova Despesa"}
            >
                <PayableFormVisual
                    initialData={selectedPayable}
                    onCancel={toggleModal}
                    hideTitle={true}
                    onSave={handleSave}
                />
            </GenericModal>

            <PayablePaymentModal
                isOpen={paymentModal}
                toggle={() => setPaymentModal(false)}
                payable={selectedPayableForPayment}
                onPay={handlePaymentConfirm}
            />

            {/* Confirm Dialog - Delete */}
            <ConfirmDialog
                isOpen={!!payableToDeleteId}
                toggle={() => setPayableToDeleteId(null)}
                title="Excluir Despesa"
                description="Deseja realmente excluir esta despesa? Esta ação não pode ser desfeita."
                onConfirm={handleConfirmDelete}
                confirmColor="danger"
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
            />
        </React.Fragment>
    );
};

export default PayablesPage;
