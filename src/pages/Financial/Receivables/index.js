import React, { useState, useRef, useCallback } from 'react';
import {
    Card, CardBody, Badge, Input, Label,
    UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem,
    Button, Row, Col, Collapse
} from 'reactstrap';
import BasicTable from '../../../components/Common/BasicTable';
import ConfirmDialog from '../../../components/Common/ConfirmDialog';
import { formatCurrency } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { formatId } from '../../../utils/sequence';
import {
    PAYMENT_METHOD_LABELS,
    STATUS_COLORS,
    STATUS_LABELS
} from '../../../utils/constants';
import "flatpickr/dist/themes/material_blue.css"
import Flatpickr from "react-flatpickr"
import { Portuguese } from "flatpickr/dist/l10n/pt.js"

import PageLoader from "../../../components/Common/PageLoader"

// Hook
import { useReceivablesList } from './hooks/useReceivablesList';
import ReceivableSettlementModal from './ReceivableSettlementModal';
import ReceivableDetailsModal from './ReceivableDetailsModal';
import ReceivableAnticipationModal from './ReceivableAnticipationModal';
import Miniwidget from '../../Dashboard/Miniwidget';

/**
 * Página de Contas a Receber (Receivables)
 * View Component - Responsável apenas pela renderização
 */
const ReceivablesPage = () => {
    document.title = "Contas a Receber | PGA Admin";

    const {
        receivables,
        isLoading,
        searchTerm,
        setSearchTerm,
        filteredData, // Keep filteredData for memoization, but search will be triggered by button
        kpis,
        handleSettle,
        handleCancel,
        handleAnticipate,
        handleLoadMore,
        hasMore,
        loadReceivables, // Destructured from useReceivablesList
        selectedIds,
        setSelectedIds,
        isAnticipationModalOpen,
        setIsAnticipationModalOpen,
        toggleSelect,
        statusFilter,
        setStatusFilter,
        paymentFilter,
        setPaymentFilter,
        dateRange,
        setDateRange
    } = useReceivablesList();

    // State local para controle dos Modais
    const [selectedReceivable, setSelectedReceivable] = useState(null);
    const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

    // Memoizar dados com estado de seleção para forçar re-render do BasicTable
    const receivablesWithSelection = React.useMemo(() => {
        return filteredData.map(r => ({
            ...r,
            isSelected: selectedIds.includes(String(r.id))
        }));
    }, [filteredData, selectedIds]);

    // Definição das Colunas para o BasicTable
    const columns = React.useMemo(() => [
        {
            label: (
                <div className="form-check font-size-16">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="checkAll"
                        onChange={(e) => {
                            if (e.target.checked) {
                                const openIds = filteredData
                                    .filter(r => r.status === 'open')
                                    .map(r => String(r.id));
                                setSelectedIds(openIds);
                            } else {
                                setSelectedIds([]);
                            }
                        }}
                        checked={
                            selectedIds.length > 0 &&
                            filteredData.filter(r => r.status === 'open').length > 0 &&
                            filteredData.filter(r => r.status === 'open').every(r => selectedIds.includes(String(r.id)))
                        }
                    />
                    <label className="form-check-label" htmlFor="checkAll"></label>
                </div>
            ),
            key: 'checkbox',
            render: (receivable) => (
                <div
                    className="form-check font-size-16"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(receivable.id);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id={`check-${receivable.id}`}
                        disabled={receivable.status !== 'open'}
                        checked={!!receivable.isSelected}
                        onChange={() => { }} // Toggle handled by div onClick
                        style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label" style={{ cursor: 'pointer' }} htmlFor={`check-${receivable.id}`}></label>
                </div>
            )
        },
        {
            label: "Venda",
            key: "saleNumber",
            render: (receivable) => (
                <div>
                    <div className="fw-bold text-dark">{formatId(receivable.saleNumber)}</div>
                    <small className="text-muted">{receivable.description || 'Venda PDV'}</small>
                </div>
            )
        },
        {
            label: "Cliente",
            key: "clientName",
            render: (receivable) => (
                <div>
                    <div className="fw-bold">{receivable.clientName}</div>
                    <small className="text-muted">ID: {receivable.clientGymId || receivable.idGym || receivable.friendlyId || receivable.idClient?.substring(0, 8)}</small>
                </div>
            )
        },
        {
            label: "Vencimento",
            key: "dueDate",
            render: (receivable) => (
                <div className={receivable.virtualStatus === 'overdue' ? 'text-danger fw-bold' : ''}>
                    {formatDate(receivable.dueDate)}
                </div>
            )
        },
        {
            label: "Forma",
            key: "paymentMethod",
            render: (receivable) => (
                <div>
                    <i className={`mdi ${['credit_card', 'debit_card'].includes(receivable.paymentMethod) ? 'mdi-credit-card text-primary' :
                        'mdi-bank text-muted'
                        } font-size-18 me-2`}></i>
                    {PAYMENT_METHOD_LABELS[receivable.paymentMethod] || receivable.paymentMethod}
                </div>
            )
        },
        {
            label: "Valor",
            key: "amount",
            render: (receivable) => (
                <div className="fw-bold text-primary">
                    {formatCurrency(receivable.netAmount || receivable.amount)}
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (receivable) => (
                <div className="text-center">
                    <Badge color={STATUS_COLORS[receivable.virtualStatus]} className="font-size-11">
                        {STATUS_LABELS[receivable.virtualStatus]}
                    </Badge>
                </div>
            )
        },
        {
            label: "Ações",
            key: "actions",
            render: (receivable) => (
                <div className="text-end">
                    <UncontrolledDropdown onClick={(e) => e.stopPropagation()}>
                        <DropdownToggle className="card-drop" tag="span" role="button">
                            <i className="mdi mdi-dots-horizontal font-size-18"></i>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-end">
                            <DropdownItem onClick={() => {
                                setSelectedReceivable(receivable);
                                setIsDetailsModalOpen(true);
                            }}>
                                <i className="mdi mdi-eye font-size-16 text-primary me-1"></i> Ver Detalhes
                            </DropdownItem>

                            {receivable.status === 'open' && (
                                <DropdownItem onClick={() => {
                                    setSelectedReceivable(receivable);
                                    setIsSettlementModalOpen(true);
                                }}>
                                    <i className="mdi mdi-check-circle-outline font-size-16 text-success me-1"></i> Dar Baixa
                                </DropdownItem>
                            )}

                            {receivable.status !== 'cancelled' && (
                                <DropdownItem onClick={() => handleOpenCancel(receivable)}>
                                    <i className="mdi mdi-close-circle-outline font-size-16 text-danger me-1"></i> Cancelar
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </div>
            )
        }
    ], [selectedIds, filteredData, toggleSelect, setSelectedIds]);
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

    // State para confirmação de cancelamento
    const [receivableToCancel, setReceivableToCancel] = useState(null);

    const handleOpenCancel = (receivable) => {
        setReceivableToCancel(receivable);
    }

    const handleConfirmCancel = () => {
        if (receivableToCancel) {
            handleCancel(receivableToCancel.id);
            setReceivableToCancel(null);
        }
    }

    if (isLoading && receivables.length === 0) return <PageLoader />

    return (
        <React.Fragment>
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="font-size-18 text-uppercase fw-bold">Contas a Receber</h4>
                {selectedIds.length > 0 && (
                    <div className="d-flex gap-2 animate__animated animate__fadeIn">
                        <Button
                            color="primary"
                            className="btn-md shadow-sm"
                            onClick={() => setIsAnticipationModalOpen(true)}
                        >
                            <i className="mdi mdi-flash me-1"></i> Antecipar {selectedIds.length} selecionados
                        </Button>
                        <Button
                            color="light"
                            className="btn-md border"
                            onClick={() => setSelectedIds([])}
                        >
                            Limpar Seleção
                        </Button>
                    </div>
                )}
            </div>

            {/* KPI CARDS */}
            <Miniwidget
                colSize={4}
                reports={[
                    { title: "A Receber", iconClass: "clock-outline", total: formatCurrency(kpis.pending), average: `${kpis.countPending || 0} parcelas`, badgecolor: "warning" },
                    { title: "Em Atraso", iconClass: "alert-circle-outline", total: formatCurrency(kpis.overdue), average: `${kpis.countOverdue || 0} parcelas`, badgecolor: "danger" },
                    { title: "Recebido", iconClass: "check-circle-outline", total: formatCurrency(kpis.received), average: "Valor líquido", badgecolor: "success" },
                ]}
            />

            {/* FILTROS E TABELA */}
            <Card className="shadow-sm border-0">
                <CardBody>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Status</Label>
                            <Input type="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">Todos os Status</option>
                                <option value="open">A Receber</option>
                                <option value="overdue">Atrasados</option>
                                <option value="paid">Recebidos</option>
                            </Input>
                        </Col>

                        <Col md={6}>
                            <Label className="form-label font-size-13 text-muted fw-bold text-uppercase">Pesquisa Rápida</Label>
                            <div className="search-box">
                                <div className="position-relative">
                                    <Input
                                        type="text"
                                        className="form-control rounded"
                                        placeholder="Nome do cliente, número da venda ou descrição..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && loadReceivables()}
                                    />
                                    <i className="mdi mdi-magnify search-icon"></i>
                                </div>
                            </div>
                        </Col>

                        <Col md={3} className="d-flex gap-2">
                            <Button
                                color="primary"
                                className="w-100 py-2"
                                onClick={loadReceivables}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <><i className="mdi mdi-loading mdi-spin me-1"></i> Buscando...</>
                                ) : (
                                    <><i className="mdi mdi-filter-variant me-1"></i> PROCURAR</>
                                )}
                            </Button>
                            <Button
                                color="light"
                                className="py-2"
                                onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                                active={moreFiltersOpen}
                                title="Filtros Avançados"
                            >
                                <i className={`mdi mdi-chevron-${moreFiltersOpen ? 'up' : 'down'}`}></i>
                            </Button>
                        </Col>
                    </Row>

                    <Collapse isOpen={moreFiltersOpen} className="mt-3">
                        <div className="bg-light p-3 rounded border border-light border-dashed">
                            <Row className="g-3">
                                <Col md={4}>
                                    <Label className="font-size-11 fw-bold text-uppercase text-muted">Forma de Pagto</Label>
                                    <Input type="select" bsSize="sm" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                                        <option value="all">Todas as Formas</option>
                                        <option value="credit_card">Cartão de Crédito</option>
                                        <option value="debit_card">Cartão de Débito</option>
                                        <option value="pix">PIX</option>
                                        <option value="money">Dinheiro</option>
                                        <option value="pending_payment">Crediário / Boleto</option>
                                    </Input>
                                </Col>
                                <Col md={4}>
                                    <Label className="font-size-11 fw-bold text-uppercase text-muted">Vencimento Início</Label>
                                    <Flatpickr
                                        className="form-control form-control-sm"
                                        value={dateRange.start}
                                        options={{
                                            dateFormat: "d/m/Y",
                                            locale: Portuguese
                                        }}
                                        onChange={(dates) => {
                                            if (dates.length > 0) setDateRange(prev => ({ ...prev, start: dates[0] }))
                                        }}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="font-size-11 fw-bold text-uppercase text-muted">Vencimento Fim</Label>
                                    <Flatpickr
                                        className="form-control form-control-sm"
                                        value={dateRange.end}
                                        options={{
                                            dateFormat: "d/m/Y",
                                            locale: Portuguese
                                        }}
                                        onChange={(dates) => {
                                            if (dates.length > 0) setDateRange(prev => ({ ...prev, end: dates[0] }))
                                        }}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Collapse>
                </CardBody>
            </Card>
            <BasicTable
                key={`receivables-table-${selectedIds.length}`}
                columns={columns}
                data={receivablesWithSelection}
                loading={isLoading}
                hideSearch={true}
                hideNew={true}
                externalSearch={searchTerm}
                onExternalSearchChange={setSearchTerm}
                onRowClick={(receivable) => {
                    if (receivable.status === 'open') {
                        toggleSelect(receivable.id);
                    }
                }}
            />

            {/* INFINITE SCROLL SENTINEL */}
            {hasMore && (
                <div ref={lastBookElementRef} className="text-center p-4">
                    {isLoading && (
                        <div>
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                            <span className="text-muted font-size-12">Carregando mais...</span>
                        </div>
                    )}
                </div>
            )}

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
                onAnticipate={handleAnticipate}
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
        </React.Fragment>
    );
};

export default ReceivablesPage;
