import React, { useMemo } from 'react';
import BasicTable from '../../../../components/Common/BasicTable';
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { formatCurrency } from '../../../../utils/format';
import { formatDate } from '../../../../utils/date';
import { PAYABLE_STATUS_COLORS, PAYABLE_STATUS_LABELS } from '../../../../utils/constants';

export const PayablesTable = ({
    data,
    loading,
    hasMore,
    lastElementRef,
    onEdit,
    onPay,
    onDelete,
    searchTerm,
    setSearchTerm
}) => {

    const columns = useMemo(() => [
        {
            label: "Fornecedor",
            key: "supplier",
            render: (payable) => (
                <div>
                    <h5 className="font-size-14 mb-1">{payable.supplier || "Sem fornecedor"}</h5>
                    {payable.expenseNumber && (
                        <span className="badge bg-soft-secondary text-secondary font-size-11">
                            #{payable.expenseNumber}
                        </span>
                    )}
                </div>
            )
        },
        {
            label: "Descrição",
            key: "description",
            render: (payable) => (
                <div className="text-muted font-size-13">
                    {payable.description || payable.title || '-'}
                </div>
            )
        },
        {
            label: "Vencimento",
            key: "dueDate",
            render: (payable) => (
                <div className="fw-medium">
                    {formatDate(payable.dueDate)}
                </div>
            )
        },
        {
            label: "Categoria",
            key: "category",
            render: (payable) => (
                <Badge color="light" className="text-muted border">
                    {payable.category || "Geral"}
                </Badge>
            )
        },
        {
            label: "Valor",
            key: "amount",
            render: (payable) => (
                <div className="fw-bold text-danger">
                    {formatCurrency(payable.amount)}
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (payable) => (
                <div className="text-center">
                    <Badge color={PAYABLE_STATUS_COLORS[payable.status]} className="font-size-11">
                        {PAYABLE_STATUS_LABELS[payable.status]}
                    </Badge>
                </div>
            )
        },
        {
            label: "Ações",
            key: "actions",
            render: (payable) => (
                <div className="text-end">
                    <UncontrolledDropdown onClick={(e) => e.stopPropagation()}>
                        <DropdownToggle className="card-drop" tag="span" role="button">
                            <i className="mdi mdi-dots-horizontal font-size-18"></i>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-end">
                            <DropdownItem onClick={() => onEdit(payable)}>
                                <i className="mdi mdi-pencil font-size-16 text-primary me-1"></i> Editar
                            </DropdownItem>

                            {payable.status === 'open' && (
                                <DropdownItem onClick={() => onPay(payable)}>
                                    <i className="mdi mdi-check-circle-outline font-size-16 text-success me-1"></i> Baixar Pagamento
                                </DropdownItem>
                            )}

                            <DropdownItem divider />
                            <DropdownItem className="text-danger" onClick={() => onDelete(payable.id)}>
                                <i className="mdi mdi-trash-can-outline font-size-16 me-1"></i> Excluir
                            </DropdownItem>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </div>
            )
        }
    ], [onEdit, onPay, onDelete]);

    return (
        <React.Fragment>
            <BasicTable
                columns={columns}
                data={data}
                loading={loading}
                hideNew={true}
                hideSearch={true}
                paginationPosition="hidden"
                defaultPageSize={5000}
                externalSearch={searchTerm}
                onExternalSearchChange={setSearchTerm}
            />

            {/* Infinite Scroll Sentinel */}
            {hasMore && (
                <div ref={lastElementRef} className="text-center p-3">
                    {loading && (
                        <div>
                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                            <small className="text-muted">Carregando mais...</small>
                        </div>
                    )}
                </div>
            )}
        </React.Fragment>
    );
};
