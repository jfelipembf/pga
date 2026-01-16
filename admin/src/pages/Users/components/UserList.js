import React, { useMemo } from "react"
import { Badge, Button, UncontrolledTooltip } from "reactstrap"
import TableWithPhoto from "../../../components/Common/TableWithPhoto"
import { formatUserForTable } from "../utils/userUtils"
import PropTypes from "prop-types"

const UserList = ({ users, onEdit, onDelete, isLoading }) => {
    const data = useMemo(() => users.map(formatUserForTable), [users])

    const columns = useMemo(
        () => [
            {
                label: "Nome",
                key: "fullName",
            },
            {
                label: "Email",
                key: "email",
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

    if (isLoading && !users.length) {
        // BasicTable handles empty state, but we could return null or skeleton here
    }

    return (
        <TableWithPhoto
            columns={columns}
            data={data}
            photoKey="photo"
            onNewClick={null} // Handled by parent
        />
    )
}

UserList.propTypes = {
    users: PropTypes.array.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
}

export default UserList
