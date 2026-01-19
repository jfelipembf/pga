export const RECEIVABLE_STATUS = {
    OPEN: "open",
    PAID: "paid",
    OVERDUE: "overdue",
    CANCELED: "canceled",
}

export const RECEIVABLE_STATUS_LABELS = {
    [RECEIVABLE_STATUS.OPEN]: "Em Aberto",
    [RECEIVABLE_STATUS.PAID]: "Pago",
    [RECEIVABLE_STATUS.OVERDUE]: "Vencido",
    [RECEIVABLE_STATUS.CANCELED]: "Cancelado",
}

export const RECEIVABLE_STATUS_COLORS = {
    [RECEIVABLE_STATUS.OPEN]: "warning", // Yellow
    [RECEIVABLE_STATUS.PAID]: "success", // Green
    [RECEIVABLE_STATUS.OVERDUE]: "danger", // Red
    [RECEIVABLE_STATUS.CANCELED]: "secondary", // Grey
}
