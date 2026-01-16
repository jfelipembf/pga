export const STATUS = {
    ACTIVE: {
        value: "active",
        label: "Ativo",
        color: "success", // Green
    },
    INACTIVE: {
        value: "inactive",
        label: "Inativo",
        color: "secondary", // Grey
    },
    SUSPENDED: {
        value: "suspended",
        label: "Suspenso",
        color: "warning", // Yellow/Orange
    },
    CANCELLED: {
        value: "cancelled",
        label: "Cancelado",
        color: "danger", // Red
    },
}

export const getStatusColor = (statusValue) => {
    const status = Object.values(STATUS).find((s) => s.value === statusValue)
    return status ? status.color : "secondary"
}

export const getStatusLabel = (statusValue) => {
    const status = Object.values(STATUS).find((s) => s.value === statusValue)
    return status ? status.label : statusValue
}
