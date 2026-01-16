import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getFirebaseBackend } from "./firebase_helper"

export const uploadImage = async (file, path) => {
    const backend = getFirebaseBackend()
    // Ensure app is initialized; getting storage instance
    const storage = getStorage(backend.app)
    const storageRef = ref(storage, path)

    try {
        const snapshot = await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)
        return downloadURL
    } catch (error) {
        console.error("Error uploading image: ", error)
        throw error
    }
}
