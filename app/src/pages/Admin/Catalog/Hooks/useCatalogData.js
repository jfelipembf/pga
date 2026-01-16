import React from "react"

import {
  listProducts,
  listServices,
  createProduct,
  updateProduct,
  createService,
  updateService,
} from "../../../../services/Catalog"
import { buildProductPayload, buildServicePayload } from "../../../../services/payloads"

import { usePhotoUpload } from "../../../../hooks/usePhotoUpload"

export const useCatalogData = ({ withLoading, toast }) => {
  const [products, setProducts] = React.useState([])
  const [services, setServices] = React.useState([])

  // Hooks de upload dedicados para cada tipo de entidade
  const { uploadPhoto: uploadProductPhoto } = usePhotoUpload({ entity: "products" })
  const { uploadPhoto: uploadServicePhoto } = usePhotoUpload({ entity: "services" })

  const load = React.useCallback(async () => {
    try {
      let result = { products: [], services: [] }

      await withLoading("page", async () => {
        const [prods, servs] = await Promise.all([listProducts(), listServices()])
        const safeProds = prods || []
        const safeServs = servs || []

        setProducts(safeProds)
        setServices(safeServs)

        result = { products: safeProds, services: safeServs }
      })

      return result
    } catch (e) {
      console.error(e)
      toast?.show?.({
        title: "Erro ao carregar catálogo",
        description: e?.message || String(e),
        color: "danger",
      })
      return { products: [], services: [] }
    }
  }, [withLoading, toast])

  const saveItem = React.useCallback(
    async ({ isProductsTab, item, isDraft }) => {
      if (!item) return { ok: false }

      try {
        let result = { ok: true }

        await withLoading("save", async () => {
          let photo = item.photo || ""

          if (item.photoFile) {
            const uploader = isProductsTab ? uploadProductPhoto : uploadServicePhoto
            const prefix = isProductsTab ? "prod" : "serv"
            const res = await uploader(item.photoFile, { filenamePrefix: prefix })
            photo = res.url
          }

          if (isProductsTab) {
            const raw = { ...item, photo: photo }
            const payload = buildProductPayload(raw)

            if (isDraft) {
              const created = await createProduct(payload)
              setProducts(prev => [{ ...created, preview: created.photo }, ...prev])
              result = { ok: true, created, createdId: created?.id }
              return
            }

            // Update
            await updateProduct(item.id, payload)
            const updatedMapped = { ...payload, id: item.id }

            setProducts(prev =>
              prev.map(p =>
                p.id === item.id ? { ...p, ...updatedMapped, preview: updatedMapped.photo } : p
              )
            )
            result = { ok: true, updated: true, updatedId: item.id }
            return
          }

          // services
          const raw = { ...item, photo: photo }
          const payload = buildServicePayload(raw)

          if (isDraft) {
            const created = await createService(payload)
            setServices(prev => [{ ...created, preview: created.photo }, ...prev])
            result = { ok: true, created, createdId: created?.id }
            return
          }

          // Update service
          await updateService(item.id, payload)
          const updatedMapped = { ...payload, id: item.id }

          setServices(prev =>
            prev.map(s =>
              s.id === item.id ? { ...s, ...updatedMapped, preview: updatedMapped.photo } : s
            )
          )
          result = { ok: true, updated: true, updatedId: item.id }
        })

        return result
      } catch (e) {
        console.error(e)
        toast?.show?.({
          title: "Erro ao salvar",
          description: e?.message || String(e),
          color: "danger",
        })
        return { ok: false, error: e }
      }
    },
    [withLoading, toast, uploadProductPhoto, uploadServicePhoto]
  )

  return {
    products,
    services,
    setProducts,
    setServices,
    load,
    saveItem,
  }
}
