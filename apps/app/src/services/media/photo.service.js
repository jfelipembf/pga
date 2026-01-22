// src/services/media/photo.service.js
import { uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
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

/**
 * Deleta uma foto do Storage usando a URL completa.
 * Extrai o path da URL e deleta o arquivo.
 * 
 * @param {string} photoUrl - URL completa da foto (ex: https://firebasestorage.googleapis.com/...)
 * @returns {Promise<boolean>} - true se deletado com sucesso, false se não encontrado
 */
export const deleteEntityPhoto = async (photoUrl) => {
  if (!photoUrl || typeof photoUrl !== 'string') {
    console.warn('[deleteEntityPhoto] URL inválida ou vazia')
    return false
  }

  try {
    // Extrai o path da URL do Firebase Storage
    // Formato: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token={token}
    const match = photoUrl.match(/\/o\/(.+?)\?/)
    if (!match) {
      console.warn('[deleteEntityPhoto] Não foi possível extrair path da URL:', photoUrl)
      return false
    }

    const encodedPath = match[1]
    const path = decodeURIComponent(encodedPath)
    
    const ref = storageRefFromPath(path)
    await deleteObject(ref)
    
    console.log('[deleteEntityPhoto] Foto deletada com sucesso:', path)
    return true
  } catch (error) {
    // Se o arquivo não existe (404), não é um erro crítico
    if (error.code === 'storage/object-not-found') {
      console.warn('[deleteEntityPhoto] Arquivo não encontrado (já foi deletado):', photoUrl)
      return false
    }
    
    console.error('[deleteEntityPhoto] Erro ao deletar foto:', error)
    throw error
  }
}
