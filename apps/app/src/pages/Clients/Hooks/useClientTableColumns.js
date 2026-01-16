import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import { Button } from "reactstrap"
import StatusBadge from "../../../components/Common/StatusBadge"
import { TABLE_PLACEHOLDER_AVATAR as placeholderAvatar } from "../Constants/defaults"

export const useClientTableColumns = ({ contractsByClient, profilePath }) => {
    return useMemo(
        () => [
            {
                key: "photo",
                label: "Cliente",
                render: item => (
                    <div className="d-flex align-items-center gap-3">
                        <img
                            src={item.photo || placeholderAvatar}
                            alt={item.name}
                            className="rounded-circle"
                            style={{ objectFit: 'cover', flexShrink: 0 }}
                            width="48"
                            height="48"
                        />
                        <div>
                            <div className="fw-semibold">{item.name}</div>
                            <div className="text-muted fs-12">{item.idGym || "--"}</div>
                            {item.age && <div className="text-muted fs-12">{item.age} anos</div>}
                        </div>
                    </div>
                ),
            },
            {
                key: "status",
                label: "Status",
                render: item => {
                    const contracts = contractsByClient[item.id] || []
                    // Usar o primeiro contrato (mais recente) se houver, senão status do cliente
                    const contract = contracts.length > 0 ? contracts[0] : null
                    const statusToShow = contract ? contract.status : item.status
                    const typeToShow = contract ? "contract" : "client"
                    return <StatusBadge status={statusToShow} type={typeToShow} />
                },
            },
            {
                key: "age",
                label: "Idade",
                render: item => (item.age ? `${item.age} anos` : "--"),
            },
            {
                key: "phone",
                label: "Telefone",
            },
            {
                key: "email",
                label: "Email",
            },
            {
                key: "actions",
                label: "Ações",
                render: item => (
                    <Button color="link" className="p-0" tag={Link} to={`${profilePath}?id=${item.id}`}>
                        Ver
                    </Button>
                ),
            },
        ],
        [contractsByClient, profilePath]
    )
}
