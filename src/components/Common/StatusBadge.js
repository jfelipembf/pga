import React from "react"
import { Badge } from "reactstrap"
import PropTypes from "prop-types"

/**
 * Componente de Badge de Status reutilizável com cores pré-definidas.
 */
const StatusBadge = ({ status, customLabels = {} }) => {
    const statusConfig = {
        active: { color: "success", label: "Ativo" },
        inactive: { color: "danger", label: "Inativo" },
        lead: { color: "info", label: "Lead" },
        pending: { color: "warning", label: "Pendente" },
        expired: { color: "secondary", label: "Expirado" },
        suspended: { color: "dark", label: "Suspenso" }
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
