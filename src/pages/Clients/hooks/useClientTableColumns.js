import React, { useMemo } from "react"
import { Button } from "reactstrap"
import { useNavigate, useParams } from "react-router-dom"

export const useClientTableColumns = () => {
    const { idTenant, idBranch } = useParams()
    const navigate = useNavigate()

    const columns = useMemo(() => [
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
                const idLabel = client.friendlyId || client.idGym || client.id?.substring(0, 6).toUpperCase()
                return (
                    <div>
                        <h5 className="font-size-14 mb-1 text-uppercase">{fullName}</h5>
                        <p className="text-muted mb-0 font-size-12">ID: {idLabel}</p>
                    </div>
                )
            }
        },
        {
            label: "Contato",
            key: "email",
            render: (client) => (
                <div>
                    <div className="text-lowercase">{client.email || '-'}</div>
                    <small className="text-muted">{client.phone || '-'}</small>
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (client) => {
                // USA O SERVIÇO PARA CALCULAR STATUS REAL (AGORA OTIMIZADO PELO COMPUTED)
                const { ClientService } = require("../../../services/Clients/ClientService")
                const status = ClientService.calculateLiveStatus(client)

                const statusColors = {
                    lead: "warning",
                    scheduled: "info",
                    attended: "primary",
                    active: "success",
                    suspended: "secondary",
                    inactive: "danger",
                    lost: "dark"
                }

                const labels = {
                    lead: "Lead",
                    scheduled: "Agendado",
                    attended: "Compareceu",
                    active: "Ativo",
                    suspended: "Suspenso",
                    inactive: "Inativo",
                    lost: "Perdido"
                }

                const color = statusColors[status] || "secondary"

                return (
                    <span className={`badge bg-${color} font-size-12 px-2 py-1`}>
                        {labels[status] || status}
                    </span>
                )
            }
        },
        {
            label: "Plano / Atividades",
            key: "plan",
            render: (client) => {
                const computed = client.computed || {}
                return (
                    <div>
                        <div className="font-size-13 text-dark fw-medium">
                            {computed.activePlanName || "Sem Plano"}
                        </div>
                        <div className="font-size-11 text-muted text-truncate" style={{ maxWidth: '180px' }}>
                            {computed.activeActivities?.join(', ') || '-'}
                        </div>
                    </div>
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
