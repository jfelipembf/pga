export const CATALOG_PLACEHOLDER_PHOTO = "https://via.placeholder.com/120x120?text=Preview"

export const createBlankProduct = () => ({
  id: `product-draft-${Date.now()}`,
  name: "",
  category: "",
  price: 0,
  purchasePrice: 0,
  stock: 0,
  minStock: 0,
  sku: "",
  barcode: "",
  description: "",
  preview: null,
  photo: null,
  status: "active",
})

export const createBlankService = () => ({
  id: `service-draft-${Date.now()}`,
  name: "",
  category: "",
  price: 0,
  duration: 0,
  description: "",
  preview: null,
  photo: null,
  status: "active",
})
