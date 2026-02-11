import React, { useMemo } from "react"
import { Badge, UncontrolledTooltip, Button } from "reactstrap"
import { Link, useParams } from "react-router-dom"
import moment from "moment"
import { formatCurrency } from "../../../utils/format"
import BasicTable from "../../../components/Common/BasicTable"
import { exportToCSV } from "../../../utils/csvExport"
import { toast } from "react-toastify"

export const CRMResults = ({ clients, loading }) => {
    const { idTenant, idBranch } = useParams()

    const handleExport = () => {
        if (!clients || !clients.length) {
            toast.warning("Nenhum dado para exportar")
            return
        }

        const dataToExport = clients.map(client => ({
            "Nome": client.name,
            "Email": client.email || "-",
            "Telefone": client.phone || "-",
            "Situação": client.lifecycleStatus,
            "Plano": client.planName,
            "Status Contrato": client.contractStatus,
            "Vencimento": client.contractEndDate,
            "Mensalidade": client.monthlyValue
        }))

        exportToCSV(dataToExport, `relatorio_crm_${moment().format('YYYYMMDD_HHmm')}`)
        toast.success("Relatório exportado com sucesso!")
    }

    const handleMassMessage = () => {
        if (!clients || !clients.length) {
            toast.warning("Nenhum cliente selecionado")
            return
        }

        const phones = clients
            .map(c => c.phone?.replace(/\D/g, ''))
            .filter(p => p && p.length >= 10)

        if (phones.length === 0) {
            toast.warning("Nenhum cliente com telefone válido encontrado")
            return
        }

        if (phones.length === 1) {
            window.open(`https://wa.me/55${phones[0]}`, "_blank")
            return
        }

        toast.info(`${phones.length} telefones identificados. A lista foi copiada para facilitar o disparo.`)
        navigator.clipboard.writeText(phones.join('\n'))
        toast.success("Lista de números copiada!")
    }

    const columns = useMemo(() => [
        {
            label: "Nome / Contato",
            key: "name",
            render: (client) => (
                <div className="d-flex align-items-center">
                    {client.photo ? (
                        <img
                            src={client.photo}
                            alt=""
                            className="avatar-xs rounded-circle me-2"
                        />
                    ) : (
                        <div className="avatar-xs me-2">
                            <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-12">
                                {client.name ? client.name.charAt(0) : "C"}
                            </span>
                        </div>
                    )}
                    <div>
                        <h5 className="font-size-14 m-0 text-truncate" style={{ maxWidth: "150px" }}>
                            <Link to={`/${idTenant}/${idBranch}/clients/${client.id}`} className="text-dark fw-medium">
                                {client.name}
                            </Link>
                        </h5>
                        <small className="text-muted">{client.phone || client.email}</small>
                    </div>
                </div>
            )
        },
        {
            label: "Situação",
            key: "status",
            render: (client) => {
                const configs = {
                    active: { label: "Ativo", color: "success" },
                    inactive: { label: "Inativo", color: "danger" },
                    suspended: { label: "Suspenso", color: "warning" },
                    lead: { label: "Lead", color: "secondary" },
                    canceled: { label: "Cancelado", color: "danger" }
                }

                // Prioridade: Status do Contrato se for crítico, senão Lifecycle
                let statusKey = client.lifecycleStatus

                // Mapeamento de normalização para os 5 estados
                if (client.contractStatus === 'active') statusKey = 'active'
                else if (client.contractStatus === 'suspended') statusKey = 'suspended'
                else if (client.contractStatus === 'canceled' || client.lifecycleStatus === 'lost') statusKey = 'canceled'
                else if (client.lifecycleStatus === 'inactive') statusKey = 'inactive'
                else if (client.lifecycleStatus === 'lead' || !client.contractStatus || client.contractStatus === 'no_contract') statusKey = 'lead'

                const config = configs[statusKey] || { label: statusKey, color: "secondary" }
                return (
                    <Badge className={`badge-soft-${config.color} font-size-11`}>
                        {config.label}
                    </Badge>
                )
            }
        },
        {
            label: "Plano / Vencimento",
            key: "contractEndDate",
            render: (client) => (
                <div>
                    <div className="font-size-13">{client.planName || "Sem Plano"}</div>
                    <small className={`text-${client.daysToExpiration < 30 && client.daysToExpiration > 0 ? 'danger' : 'muted'}`}>
                        Vence: {client.contractEndDate || "-"}
                    </small>
                </div>
            )
        },
        {
            label: "Atividades",
            key: "activities",
            render: (client) => (
                <div className="d-flex flex-wrap gap-1">
                    {client.activities && client.activities.length > 0 ? (
                        client.activities.map((act, i) => (
                            <Badge key={i} color="light" className="text-dark border font-size-10">
                                {act}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted font-size-12">-</span>
                    )}
                </div>
            )
        },
        {
            label: "Valor/Mês",
            key: "monthlyValue",
            render: (client) => (
                <span className="fw-medium text-dark">
                    {formatCurrency(client.monthlyValue || 0)}
                </span>
            )
        },
        {
            label: "Ações",
            key: "actions",
            render: (client) => (
                <div className="d-flex gap-2 font-size-16">
                    <Link to="#" className="text-success" id={`whatsapp-crm-${client.id}`}>
                        <i className="mdi mdi-whatsapp"></i>
                        <UncontrolledTooltip placement="top" target={`whatsapp-crm-${client.id}`}>
                            WhatsApp
                        </UncontrolledTooltip>
                    </Link>
                    <Link to={`/${idTenant}/${idBranch}/clients/${client.id}`} className="text-primary" id={`view-crm-${client.id}`}>
                        <i className="mdi mdi-eye-outline"></i>
                        <UncontrolledTooltip placement="top" target={`view-crm-${client.id}`}>
                            Ver Perfil
                        </UncontrolledTooltip>
                    </Link>
                </div>
            )
        }
    ], [idTenant, idBranch])

    const topContent = (
        <div className="d-flex gap-2">
            <Button
                color="success"
                className="btn-soft-success waves-effect waves-light"
                size="sm"
                onClick={handleMassMessage}
                id="mass-message-tooltip"
            >
                <i className="mdi mdi-whatsapp font-size-16"></i>
                <UncontrolledTooltip placement="top" target="mass-message-tooltip">
                    Mensagem em Massa
                </UncontrolledTooltip>
            </Button>
            <Button
                color="primary"
                className="btn-soft-primary waves-effect waves-light"
                size="sm"
                onClick={handleExport}
                id="export-csv-tooltip"
            >
                <i className="mdi mdi-download font-size-16"></i>
                <UncontrolledTooltip placement="top" target="export-csv-tooltip">
                    Exportar Resultados
                </UncontrolledTooltip>
            </Button>
        </div>
    )

    return (
        <BasicTable
            columns={columns}
            data={clients}
            loading={loading}
            topContent={topContent}
            paginationPosition="bottom"
            searchPlaceholder="Refinar busca local nos resultados..."
            searchKeys={["name", "email", "phone", "planName"]}
        />
    )
}
