export const normalizeStatusPt = status => {
  const val = (status || "").toString().toLowerCase()
  if (val === "active") return "ativo"
  if (val === "paused" || val === "pausado") return "pausado"
  if (val === "archived" || val === "arquivado") return "arquivado"
  return val || "ativo"
}

export const mapStatusColor = status => {
  const val = normalizeStatusPt(status)
  if (val === "ativo") return "success"
  if (val === "pausado") return "warning"
  return "secondary"
}
