import React, { useMemo } from "react"
import { Button } from "reactstrap"
import { useNavigate, useParams } from "react-router-dom"

export const useClientTableColumns = () => {
    const { idTenant, idBranch } = useParams()
    const navigate = useNavigate()

    const columns = useMemo(() => [
        {
            label: "ID",
            key: "id",
            render: (client) => <span className="text-muted font-size-12">{client.friendlyId || client.idGym || client.id?.substring(0, 6).toUpperCase()}</span>
        },
        {
            label: "Foto",
            key: "photo",
            render: (client) => (
                <div style={{ width: "50px" }}>
                    {client.photo || client.photoUrl ? (
                        <img
                            src={client.photo || client.photoUrl}
                            alt={client.name}
                            className="avatar-xs rounded-circle"
                            style={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="avatar-xs">
                            <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-18">
                                <i className="mdi mdi-account"></i>
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        {
            label: "Nome",
            key: "name",
            render: (client) => {
                const fullName = client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sem Nome'
                return (
                    <div>
                        <h5 className="font-size-14 mb-1">{fullName}</h5>
                        <p className="text-muted mb-0 font-size-12">{client.email || '-'}</p>
                    </div>
                )
            }
        },
        {
            label: "Telefone",
            key: "phone",
            render: (client) => client.phone || '-'
        },
        {
            label: "Status",
            key: "status",
            render: (client) => {
                const statusColors = {
                    active: "success",
                    inactive: "danger",
                    lead: "info",
                    pending: "warning"
                }
                const color = statusColors[client.status] || "secondary"

                const labels = {
                    active: "Ativo",
                    inactive: "Inativo",
                    lead: "Lead",
                    pending: "Pendente"
                }

                return (
                    <span className={`badge bg-${color} font-size-12`}>
                        {labels[client.status] || client.status}
                    </span>
                )
            }
        },
        {
            label: "Ações",
            key: "actions",
            render: (client) => (
                <Button
                    color="link"
                    className="text-primary p-0 font-size-18"
                    title="Ver Detalhes"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${idTenant}/${idBranch}/clients/${client.id}`)
                    }}
                >
                    <i className="mdi mdi-eye"></i>
                </Button>
            )
        }
    ], [idTenant, idBranch, navigate])

    return columns
}
