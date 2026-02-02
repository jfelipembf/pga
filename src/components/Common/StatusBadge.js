import React from "react"
import { Badge } from "reactstrap"
import PropTypes from "prop-types"

/**
 * Componente de Badge de Status reutilizável com cores pré-definidas.
 */
const StatusBadge = ({ status, customLabels = {} }) => {
    const statusConfig = {
        // Lifecycle Status (novo)
        // Status Financeiros e Contratos
        open: { color: "warning", label: "Aberto" },
        paid: { color: "success", label: "Pago" },
        completed: { color: "success", label: "Pago" },
        partial: { color: "info", label: "Parcial" },
        cancelled: { color: "dark", label: "Cancelado" },
        settled: { color: "success", label: "Liquidado" },
        overdue: { color: "danger", label: "Vencido" },

        // Lifecycle / Geral
        active: { color: "success", label: "Ativo" },
        suspended: { color: "secondary", label: "Suspenso" },
        inactive: { color: "danger", label: "Inativo" },
        lost: { color: "dark", label: "Perdido" },
        lead: { color: "warning", label: "Lead" },
        scheduled: { color: "info", label: "Agendado" },
        attended: { color: "primary", label: "Compareceu" },
        deleted: { color: "dark", label: "Excluído" },

        // Compatibilidade
        pending: { color: "warning", label: "Pendente" },
        expired: { color: "secondary", label: "Expirado" }
    }

    const config = statusConfig[status] || { color: "secondary", label: status }
    const label = customLabels[status] || config.label

    return (
        <Badge color={config.color} pill className="px-3 py-2 font-size-12">
            {label}
        </Badge>
    )
}

StatusBadge.propTypes = {
    status: PropTypes.string,
    customLabels: PropTypes.object
}

export default StatusBadge
