import React from "react"
import { Badge, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"
import BasicTable from "../../../../components/Common/BasicTable"
import { RECEIVABLE_STATUS_COLORS, RECEIVABLE_STATUS_LABELS } from "../Constants/receivablesConstants"

const ReceivablesTable = ({ data, loading }) => {
    const columns = [
        {
            label: "Status",
            key: "status",
            render: row => (
                <Badge
                    color={RECEIVABLE_STATUS_COLORS[row.status] || "secondary"}
                    className="font-size-11 badge-soft"
                >
                    {RECEIVABLE_STATUS_LABELS[row.status] || row.status}
                </Badge>
            ),
        },
        {
            label: "Vencimento",
            key: "dueDate",
            render: row => {
                if (!row.dueDate) return "--";
                const [y, m, d] = row.dueDate.split("-");
                return `${d}/${m}/${y}`;
            },
        },
        {
            label: "Cliente",
            key: "clientName",
            render: row => (
                <div>
                    <h6 className="text-truncate mb-0 font-size-13">{row.clientName}</h6>
                </div>
            ),
        },
        {
            label: "Descrição",
            key: "description",
            render: row => <span className="text-muted small">{row.description}</span>,
        },
        {
            label: "Forma",
            key: "method",
        },
        {
            label: "Valor",
            key: "amount",
            render: row => (
                <span className="fw-semibold">
                    {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(row.amount)}
                </span>
            ),
        },
        {
            label: "Ações",
            key: "actions",
            render: row => (
                <UncontrolledDropdown>
                    <DropdownToggle tag="a" className="text-muted font-size-18 px-2" role="button">
                        <i className="mdi mdi-dots-horizontal"></i>
                    </DropdownToggle>
                    <DropdownMenu className="dropdown-menu-end">
                        {!row.isTransaction && (
                            <>
                                <DropdownItem onClick={() => console.log("Baixar", row.id)}>
                                    <i className="bx bx-check-circle me-1 text-success"></i> Receber
                                </DropdownItem>
                                <DropdownItem onClick={() => console.log("Editar", row.id)}>
                                    <i className="bx bx-pencil me-1"></i> Editar
                                </DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem onClick={() => console.log("Cancelar", row.id)} className="text-danger">
                                    <i className="bx bx-trash me-1"></i> Cancelar
                                </DropdownItem>
                            </>
                        )}
                        {row.isTransaction && (
                            <DropdownItem disabled>
                                <i className="bx bx-lock-alt me-1"></i> Gerenciado pelo Caixa
                            </DropdownItem>
                        )}
                    </DropdownMenu>
                </UncontrolledDropdown>
            ),
        },
    ]

    return (
        <BasicTable
            columns={columns}
            data={data}
            loading={loading}
            wrapWithCard={false}
            paginationPosition="bottom"
            defaultPageSize={10}
            hideSearch={true} // We have external filters
            hideNew={true}
        />
    )
}

export default ReceivablesTable
