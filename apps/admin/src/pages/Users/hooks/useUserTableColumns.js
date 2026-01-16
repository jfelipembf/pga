import { useMemo } from "react"
import { Button, Badge, UncontrolledTooltip } from "reactstrap"

export const useUserTableColumns = ({ onEdit, onDelete }) => {
    const columns = useMemo(
        () => [
            {
                label: "Foto",
                key: "photo",
                render: (item) => (
                    <div className="avatar-xs">
                        <span className="avatar-title rounded-circle">
                            {item.photo ? (
                                <img
                                    src={item.photo}
                                    alt="Avatar"
                                    className="rounded-circle"
                                    height="50"
                                    width="50"
                                    style={{ objectFit: "cover" }}
                                />
                            ) : (
                                <div className="avatar-title rounded-circle bg-light">
                                    <i className="mdi mdi-account fs-3 text-secondary"></i>
                                </div>
                            )}
                        </span>
                    </div>
                ),
            },
            {
                label: "Nome",
                key: "fullName",
                render: (item) => (
                    <div>
                        <h5 className="font-size-14 mb-1">{item.fullName}</h5>
                        <p className="text-muted mb-0">{item.email}</p>
                    </div>
                ),
            },
            {
                label: "Telefone",
                key: "phone",
                render: (item) => item.phone || "-",
            },
            {
                label: "Idade",
                key: "age",
            },
            {
                label: "Gênero",
                key: "genderLabel",
            },
            {
                label: "Status",
                key: "statusLabel",
                render: (item) => (
                    <Badge color={item.statusColor} className="font-size-12">
                        {item.statusLabel}
                    </Badge>
                ),
            },
            {
                label: "Ações",
                key: "actions",
                render: (item) => (
                    <div className="d-flex gap-2">
                        <Button
                            color="light"
                            size="sm"
                            onClick={() => onEdit(item)}
                            id={`edit-tooltip-${item.id}`}
                        >
                            <i className="mdi mdi-pencil" />
                        </Button>
                        <UncontrolledTooltip placement="top" target={`edit-tooltip-${item.id}`}>
                            Editar
                        </UncontrolledTooltip>

                        <Button
                            color="danger"
                            size="sm"
                            onClick={() => onDelete(item.id)}
                            id={`delete-tooltip-${item.id}`}
                        >
                            <i className="mdi mdi-trash-can" />
                        </Button>
                        <UncontrolledTooltip placement="top" target={`delete-tooltip-${item.id}`}>
                            Remover
                        </UncontrolledTooltip>
                    </div>
                ),
            },
        ],
        [onEdit, onDelete]
    )

    return columns
}
