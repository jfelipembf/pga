// src/hooks/usePhotoUpload.js
import { useCallback, useState } from "react"
import { uploadEntityPhoto } from "../services/media/photo.service"

export const usePhotoUpload = ({ entity, entityId = null } = {}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const uploadPhoto = useCallback(
    async (file, { filenamePrefix = "photo", ctxOverride = null } = {}) => {
      setUploading(true)
      setError(null)
      try {
        const res = await uploadEntityPhoto({ entity, entityId, file, filenamePrefix, ctxOverride })
        return res
      } catch (e) {
        setError(e)
        throw e
      } finally {
        setUploading(false)
      }
    },
    [entity, entityId]
  )

  return { uploadPhoto, uploading, error }
}
