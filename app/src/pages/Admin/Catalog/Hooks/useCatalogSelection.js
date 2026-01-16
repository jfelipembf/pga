import React from "react"
import { createBlankProduct, createBlankService } from "../Constants/catalogDefaults"

export const useCatalogSelection = ({ activeTab }) => {
  const isProductsTab = activeTab === "products"

  const [selectedProductId, setSelectedProductId] = React.useState(null)
  const [selectedServiceId, setSelectedServiceId] = React.useState(null)

  const [productDraft, setProductDraft] = React.useState(null)
  const [serviceDraft, setServiceDraft] = React.useState(null)

  const ensureSelection = React.useCallback((products = [], services = []) => {
    setSelectedProductId(prev => prev ?? products?.[0]?.id ?? null)
    setSelectedServiceId(prev => prev ?? services?.[0]?.id ?? null)
  }, [])

  const selectedId = isProductsTab ? selectedProductId : selectedServiceId

  const currentSelection = React.useCallback(
    ({ products = [], services = [] }) => {
      if (isProductsTab) {
        if (productDraft && productDraft.id === selectedProductId) return productDraft
        const selected = (products || []).find(p => p.id === selectedProductId)
        return selected ? { ...selected, preview: selected.preview || selected.photo } : null
      }

      if (serviceDraft && serviceDraft.id === selectedServiceId) return serviceDraft
      const selected = (services || []).find(s => s.id === selectedServiceId)
      return selected ? { ...selected, preview: selected.preview || selected.photo } : null
    },
    [isProductsTab, productDraft, selectedProductId, serviceDraft, selectedServiceId]
  )

  const selectItem = React.useCallback(
    id => {
      if (isProductsTab) {
        setSelectedProductId(id)
        setProductDraft(null)
      } else {
        setSelectedServiceId(id)
        setServiceDraft(null)
      }
    },
    [isProductsTab]
  )

  const newItem = React.useCallback(() => {
    if (isProductsTab) {
      const draft = createBlankProduct()
      setProductDraft(draft)
      setSelectedProductId(draft.id)
      return draft
    }
    const draft = createBlankService()
    setServiceDraft(draft)
    setSelectedServiceId(draft.id)
    return draft
  }, [isProductsTab])

  const clearDraft = React.useCallback(() => {
    if (isProductsTab) setProductDraft(null)
    else setServiceDraft(null)
  }, [isProductsTab])

  const setSelectedToId = React.useCallback(
    id => {
      if (isProductsTab) setSelectedProductId(id)
      else setSelectedServiceId(id)
    },
    [isProductsTab]
  )

  const isDraftSelected = React.useMemo(() => {
    if (isProductsTab) return Boolean(productDraft && productDraft.id === selectedProductId)
    return Boolean(serviceDraft && serviceDraft.id === selectedServiceId)
  }, [isProductsTab, productDraft, selectedProductId, serviceDraft, selectedServiceId])

  return {
    isProductsTab,
    selectedId,
    selectedProductId,
    selectedServiceId,
    setSelectedProductId,
    setSelectedServiceId,
    productDraft,
    serviceDraft,
    setProductDraft,
    setServiceDraft,
    ensureSelection,
    currentSelection,
    selectItem,
    newItem,
    clearDraft,
    setSelectedToId,
    isDraftSelected,
  }
}
