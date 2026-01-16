import { useState } from "react"
import { uploadImage } from "../../../helpers/storage_helper"

export const useUserActions = ({ addUser, updateUser, removeUser }) => {
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [uploading, setUploading] = useState(false)

    const toggleModal = () => {
        setModalOpen(!modalOpen)
        if (modalOpen) setSelectedUser(null)
    }

    const handleCreate = () => {
        setSelectedUser(null)
        setModalOpen(true)
    }

    const handleEdit = (user) => {
        setSelectedUser(user)
        setModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja remover este usuário?")) {
            await removeUser(id)
        }
    }

    const handleSave = async (data) => {
        try {
            let photoUrl = data.photo // Existing URL or null

            // Check if 'photo' is a File object (new upload)
            if (data.photo instanceof File) {
                setUploading(true)
                const path = `users/${Date.now()}_${data.photo.name}`
                photoUrl = await uploadImage(data.photo, path)
                setUploading(false)
            }

            // Format phone to E.164 (+55...)
            let formattedPhone = data.phone?.replace(/\D/g, "") || ""
            if (formattedPhone && !formattedPhone.startsWith("55")) {
                formattedPhone = `55${formattedPhone}`
            }
            if (formattedPhone) {
                formattedPhone = `+${formattedPhone}`
            }

            const userData = { ...data, photo: photoUrl, phone: formattedPhone }

            if (selectedUser) {
                await updateUser(selectedUser.id, userData)
            } else {
                await addUser(userData)
            }
            setModalOpen(false)
        } catch (error) {
            console.error(error)
            setUploading(false)
        }
    }

    return {
        modalOpen,
        setModalOpen,
        selectedUser,
        handleCreate,
        handleEdit,
        handleDelete,
        handleSave,
        toggleModal,
        uploading
    }
}
