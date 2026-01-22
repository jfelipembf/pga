// src/hooks/usePhotoUpload.js
import { useCallback, useState } from "react"
import { uploadEntityPhoto, deleteEntityPhoto } from "../services/media/photo.service"

export const usePhotoUpload = ({ entity, entityId = null } = {}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const uploadPhoto = useCallback(
    async (file, { filenamePrefix = "photo", ctxOverride = null, deleteOldPhoto = null } = {}) => {
      setUploading(true)
      setError(null)
      try {
        // Delete old photo before uploading new one (if provided)
        if (deleteOldPhoto) {
          try {
            await deleteEntityPhoto(deleteOldPhoto)
          } catch (deleteError) {
            console.warn('[usePhotoUpload] Erro ao deletar foto antiga (continuando upload):', deleteError)
            // Continue with upload even if deletion fails
          }
        }
        
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

  const deletePhoto = useCallback(
    async (photoUrl) => {
      try {
        return await deleteEntityPhoto(photoUrl)
      } catch (e) {
        setError(e)
        throw e
      }
    },
    []
  )

  return { uploadPhoto, deletePhoto, uploading, error }
}
