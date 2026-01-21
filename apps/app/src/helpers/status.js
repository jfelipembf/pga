import { normalizeStatus } from "@pga/shared"

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
    inactive: "Inativo",
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
  task: {
    pending: "Pendente",
    in_progress: "Em Andamento",
    completed: "Concluído",
    overdue: "Atrasado",
    canceled: "Cancelado",
  },
  client: {
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
    suspended: "Suspenso",
    lead: "Lead",
  },
  common: {
    active: "Ativo",
    inactive: "Inativo",
    enabled: "Habilitado",
    disabled: "Desabilitado",
    trial: "Experimental",
    experimental: "Experimental",
    blocked: "Bloqueado",
    banned: "Banido",
    archived: "Arquivado",
    deleted: "Excluído",
    draft: "Rascunho",
    published: "Publicado",
    verified: "Verificado",
    unverified: "Não Verificado",
    approved: "Aprovado",
    rejected: "Rejeitado",
    success: "Sucesso",
    error: "Erro",
    failure: "Falha",
    warning: "Aviso",
    info: "Informação",
    new: "Novo",
    processing: "Processando",
    completed: "Completo",
    finished: "Finalizado",
  },
}

export const getStatusLabel = (status, type = "contract") => {
  const normalized = normalizeStatus(status)
  const labels = STATUS_LABELS[type] || {}
  // Try type-specific, then contract (legacy fallback), then common, then raw
  return labels[normalized] || STATUS_LABELS.contract[normalized] || STATUS_LABELS.common[normalized] || status || ""
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
  inactive: "secondary",
  in_progress: "primary",
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
