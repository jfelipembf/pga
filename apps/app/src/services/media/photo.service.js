// src/services/media/photo.service.js
import { uploadBytes, getDownloadURL } from "firebase/storage"
import { getContext } from "../Summary/index"
import { buildStoragePath, safeFileName, storageRefFromPath } from "../_core/storage"

const ENTITY_FOLDER = {
  clients: "clients/photos",
  staff: "staff/photos",
  products: "products/photos",
  services: "services/photos",
  activities: "activities/photos",
  events: "events/attachments",
}

// você pode reaproveitar pra “outros”
export const resolvePhotoFolder = (entity) => ENTITY_FOLDER[entity] || `${entity}/photos`

/**
 * Upload padronizado de foto.
 * Retorna { url, path, name, contentType, size }
 */
export const uploadEntityPhoto = async ({
  entity,          // "clients" | "staff" | "products" | "activities" | outros
  entityId = null, // opcional, mas recomendado
  file,            // File (browser)
  ctxOverride = null,
  filenamePrefix = "photo",
} = {}) => {
  if (!entity) throw new Error("entity é obrigatório")
  if (!file) throw new Error("file é obrigatório")

  const ctx = ctxOverride || getContext()
  const folder = resolvePhotoFolder(entity)

  const originalName = safeFileName(file?.name || `${filenamePrefix}.jpg`)
  const stamp = Date.now()
  const filename = `${filenamePrefix}-${stamp}-${originalName}`

  const path = buildStoragePath({
    idTenant: ctx.idTenant,
    idBranch: ctx.idBranch,
    folder,
    entityId,
    filename,
  })

  const ref = storageRefFromPath(path)

  await uploadBytes(ref, file, {
    contentType: file.type || "application/octet-stream",
  })

  const url = await getDownloadURL(ref)

  return {
    url,
    path,
    name: filename,
    contentType: file.type || null,
    size: Number(file.size || 0),
  }
}
