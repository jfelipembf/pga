// src/services/sales/sales.utils.js
// @ts-check

export const toISODate = d => {
  const date = new Date(d || new Date())
  const off = date.getTimezoneOffset()
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 10)
}

// Detecta o tipo de venda com base nos itens vendidos
export const detectSaleType = (items = []) => {
  if (!items?.length) return "generic"

  if (items.some(item => item.idContract || item.type === "contract" || item.itemType === "contract")) {
    return "contract"
  }
  if (items.some(item => item.idService || item.type === "service" || item.itemType === "service")) {
    return "service"
  }
  if (items.some(item => item.idProduct || item.type === "product" || item.itemType === "product")) {
    return "product"
  }
  if (items.some(item => item.idClass || item.idActivity || item.type === "enrollment" || item.itemType === "enrollment")) {
    return "enrollment"
  }
  return "generic"
}

/** Para ordenar lista: prioriza saleDate, senão createdAt */
export const getSaleSortTime = s => {
  if (s?.saleDate) return new Date(s.saleDate).getTime()
  if (s?.createdAt?.toMillis) return s.createdAt.toMillis()
  return 0
}
