export const resolvePhotoUrl = async ({ item, uploadFile }) => {
  if (!item) return null

  // If item already has a photo URL and no new file was provided, return existing URL
  if (item.photo && !item.photoFile) {
    return item.photo
  }

  // If there's a new photo file to upload, upload it and return the URL
  if (item.photoFile && uploadFile) {
    try {
      const photoUrl = await uploadFile(item.photoFile)
      return photoUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw new Error('Failed to upload photo')
    }
  }

  // If no photo exists, return null
  return null
}
