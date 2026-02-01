import React from "react"
import { Badge } from "reactstrap"
import PropTypes from "prop-types"

/**
 * Componente de Badge de Status reutilizável com cores pré-definidas.
 */
const StatusBadge = ({ status, customLabels = {} }) => {
    const statusConfig = {
        // Lifecycle Status (novo)
        lead: { color: "warning", label: "Lead" },
        scheduled: { color: "info", label: "Agendado" },
        attended: { color: "primary", label: "Compareceu" },
        active: { color: "success", label: "Ativo" },
        suspended: { color: "secondary", label: "Suspenso" },
        inactive: { color: "danger", label: "Inativo" },
        lost: { color: "dark", label: "Perdido" },

        // Status antigos (manter compatibilidade temporária)
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
