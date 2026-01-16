export const getCatalogSearchKeys = isProductsTab =>
  isProductsTab ? ["name", "category", "sku"] : ["name", "category"]

export const filterCatalogItems = ({ dataset = [], searchTerm = "", searchKeys = [] }) => {
  if (!searchTerm) return dataset
  const q = String(searchTerm).toLowerCase()

  return (dataset || []).filter(item =>
    (searchKeys || []).some(key =>
      String(item?.[key] || "").toLowerCase().includes(q)
    )
  )
}
