const normalizeStatus = status => String(status || "").toLowerCase().trim()

export const STATUS_LABELS = {
  contract: {
    active: "Ativo",
    waiting: "Em espera",
    pending: "Pendente",
    expired: "Expirado",
    cancelled: "Cancelado",
    canceled: "Cancelado", // Backend uses US spelling
    suspended: "Suspenso",
    cancellation_scheduled: "Cancelamento Agendado",
    scheduled_cancellation: "Cancelamento Agendado", // Backend uses this key
    suspension_scheduled: "Suspensão Agendada",
    scheduled: "Agendado",
    stopped: "Interrompido",
  },
  suspension: {
    active: "Ativa",
    scheduled: "Agendada",
    stopped: "Interrompida",
    finished: "Finalizada",
    cancelled: "Cancelada",
    canceled: "Cancelada",
  },
  enrollment: {
    active: "Ativa",
    pending: "Pendente",
    cancelled: "Cancelada",
    canceled: "Cancelada",
    completed: "Concluída",
    suspended: "Suspensa",
  },
  sale: {
    pending: "Pendente",
    paid: "Pago",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    refunded: "Reembolsado",
    open: "Aberto",
    overdue: "Vencido",
  },
  client: {
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
    suspended: "Suspenso",
  },
}

export const getStatusLabel = (status, type = "contract") => {
  const normalized = normalizeStatus(status)
  const labels = STATUS_LABELS[type] || {}
  return labels[normalized] || STATUS_LABELS.contract[normalized] || status || "" // Try type-specific, then contract fallback (common), then raw
}

/**
 * Mapeamento de cores para status (para badges e elementos visuais)
 */
export const STATUS_COLORS = {
  active: "success",
  waiting: "warning",
  pending: "warning",
  expired: "danger",
  cancelled: "danger",
  canceled: "danger",
  suspended: "secondary",
  completed: "info",
  paid: "success",
  refunded: "warning",
  open: "warning",
  overdue: "danger",
  scheduled: "info",
  scheduled_cancellation: "danger",
  cancellation_scheduled: "danger",
  stopped: "secondary",
  finished: "dark",
}

/**
 * Obtém cor para status
 * @param {string} status - Status
 * @returns {string} - Cor para uso em badges
 */
export const getStatusColor = status => {
  if (!status) return "secondary"

  const normalizedStatus = normalizeStatus(status)
  return STATUS_COLORS[normalizedStatus] || "secondary"
}
