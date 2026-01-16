import { useCallback, useState } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getFirebaseStorage } from "../helpers/firebase_helper"
import { getAuthBranchContext } from "../services/Summary/index"

/**
 * Simple hook to upload images/files to Firebase Storage.
 * It prefixes the path with tenant/branch when available.
 */
export const useStorageUpload = (basePath = "uploads") => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const uploadFile = useCallback(async (file, options = {}) => {
    const storage = getFirebaseStorage()
    if (!storage) throw new Error("Storage não inicializado")
    if (!file) throw new Error("Arquivo não informado")

    const ctx = getAuthBranchContext() || {}
    const folder = options.folder || basePath
    const name = options.fileName || `${Date.now()}-${file.name}`
    const pathParts = [folder]
    if (ctx.tenantSlug) pathParts.push(ctx.tenantSlug)
    if (ctx.branchSlug) pathParts.push(ctx.branchSlug)
    pathParts.push(name)
    const fullPath = pathParts.join("/")

    setUploading(true)
    setError(null)
    try {
      const storageRef = ref(storage, fullPath)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      return { url, path: fullPath }
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setUploading(false)
    }
  }, [basePath])

  return { uploadFile, uploading, error }
}

export default useStorageUpload
