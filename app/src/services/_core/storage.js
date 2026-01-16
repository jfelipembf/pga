// src/services/_core/storage.js
import { getStorage, ref } from "firebase/storage"

export const getStorageInstance = () => getStorage()

export const safeFileName = (name = "file") => {
  const base = String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 80)

  return base || "file"
}

/**
 * Padroniza path multi-tenant:
 * tenants/{idTenant}/branches/{idBranch}/{folder}/{entityId?}/{filename}
 */
export const buildStoragePath = ({
  idTenant,
  idBranch,
  folder,
  entityId = null,
  filename,
}) => {
  if (!idTenant || !idBranch) throw new Error("idTenant/idBranch obrigatórios para Storage path")
  if (!folder) throw new Error("folder é obrigatório")
  if (!filename) throw new Error("filename é obrigatório")

  const parts = [
    "tenants",
    String(idTenant),
    "branches",
    String(idBranch),
    String(folder),
  ]

  if (entityId) parts.push(String(entityId))
  parts.push(String(filename))

  return parts.join("/")
}

export const storageRefFromPath = (path) => {
  const storage = getStorageInstance()
  return ref(storage, path)
}
