import React, { useMemo } from 'react';
import BasicTable from '../../../../components/Common/BasicTable';
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { formatCurrency } from '../../../../utils/format';
import { formatDate } from '../../../../utils/date';
import { formatId } from '../../../../utils/sequence';
import { PAYMENT_METHOD_LABELS, STATUS_COLORS, STATUS_LABELS } from '../../../../utils/constants';

export const ReceivablesTable = ({
    data,
    isLoading,
    selectedIds,
    toggleSelect,
    setSelectedIds,
    hasMore,
    lastBookElementRef,
    onViewDetails,
    onSettle,
    onCancel,
    onDelete,
    setSearchTerm,
    searchTerm
}) => {

    // Memoizar dados com estado de seleção para forçar re-render do BasicTable
    const receivablesWithSelection = useMemo(() => {
        return data.map(r => ({
            ...r,
            isSelected: selectedIds.includes(String(r.id))
        }));
    }, [data, selectedIds]);

    const columns = useMemo(() => [
        {
            label: (
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="checkAll"
                        onChange={(e) => {
                            if (e.target.checked) {
                                const openIds = data
                                    .filter(r => r.status === 'open')
                                    .map(r => String(r.id));
                                setSelectedIds(openIds);
                            } else {
                                setSelectedIds([]);
                            }
                        }}
                        checked={
                            selectedIds.length > 0 &&
                            data.filter(r => r.status === 'open').length > 0 &&
                            data.filter(r => r.status === 'open').every(r => selectedIds.includes(String(r.id)))
                        }
                    />
                    <label className="form-check-label" htmlFor="checkAll"></label>
                </div>
            ),
            key: 'checkbox',
            render: (receivable) => (
                <div
                    className="form-check"
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
                            <DropdownItem onClick={() => onViewDetails(receivable)}>
                                <i className="mdi mdi-eye font-size-16 text-primary me-1"></i> Ver Detalhes
                            </DropdownItem>

                            {receivable.status === 'open' && (
                                <DropdownItem onClick={() => onSettle(receivable)}>
                                    <i className="mdi mdi-check-circle-outline font-size-16 text-success me-1"></i> Dar Baixa
                                </DropdownItem>
                            )}

                            {receivable.status !== 'cancelled' && (
                                <DropdownItem onClick={() => onCancel(receivable)}>
                                    <i className="mdi mdi-close-circle-outline font-size-16 text-danger me-1"></i> Cancelar
                                </DropdownItem>
                            )}

                            <DropdownItem divider />

                            <DropdownItem onClick={() => onDelete(receivable.id)} className="text-danger">
                                <i className="mdi mdi-trash-can-outline font-size-16 me-1"></i> Excluir
                            </DropdownItem>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </div>
            )
        }
    ], [selectedIds, data, toggleSelect, setSelectedIds, onViewDetails, onSettle, onCancel, onDelete]);

    return (
        <>
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
        </>
    );
};
