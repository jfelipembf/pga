import { useMemo } from "react"
import { usePhotoUpload } from "../../hooks/usePhotoUpload"

export const useActivityPhotoUpload = () => {
  const { uploadPhoto: upload, uploading, error } = usePhotoUpload({ entity: "activities", entityId: null })

  const uploadPhoto = useMemo(() => {
    return async file => {
      const res = await upload(file, { filenamePrefix: "activity" })
      return res?.url || ""
    }
  }, [upload])

  return { uploadPhoto, uploading, error }
}
