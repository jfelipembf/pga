import { useNavigate } from "react-router-dom"
import { useClientAvatarUpload, updateClient as updateClientAction, deleteClient } from "../../../services/Clients/index"
import { buildClientPayload } from "@pga/shared"
import { deleteEnrollment } from "../../../services/Enrollments/index"
import { useToast } from "../../../components/Common/ToastProvider"
import { useLoading } from "../../../hooks/useLoading"

export const useProfileActions = ({
    clientId,
    formData,
    setFormData,
    setAvatarPreview,
    setEnrollmentsState,
    updateField,
    profileName
}) => {
    const navigate = useNavigate()
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()
    const { uploadAvatar, uploading } = useClientAvatarUpload()

    const handleAvatarChange = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => setAvatarPreview(reader.result)
        reader.readAsDataURL(file)
        updateField("avatarFile", file)
    }

    const handleSave = async () => {
        if (!clientId) return
        try {
            await withLoading('save', async () => {
                let photoUrl = formData.photo
                if (formData.avatarFile) {
                    const oldPhotoUrl = formData.photo
                    const res = await uploadAvatar(formData.avatarFile, {
                        deleteOldPhoto: oldPhotoUrl
                    })
                    photoUrl = res
                }

                // Use builder to enforce strict consistency (Schema)
                const rawData = { ...formData, photo: photoUrl }
                const payload = buildClientPayload(rawData)

                await updateClientAction(clientId, payload)

                // Merge payload with previous data to preserve read-only fields like id, idGym, createdAt
                // Also clear avatarFile to prevent re-upload on subsequent saves
                setFormData(prev => {
                    const next = { ...prev, ...payload }
                    delete next.avatarFile
                    return next
                })
                setAvatarPreview(payload.photo)
                toast.show({ title: "Cliente salvo", description: profileName, color: "success" })
            })
        } catch (e) {
            console.error("Erro ao salvar cliente", e)
            toast.show({ title: "Erro ao salvar", description: e?.message || String(e), color: "danger" })
        }
    }

    const handleRemoveEnrollment = async enrollment => {

        const idToDelete = enrollment.idEnrollment || enrollment.id


        if (!idToDelete) {
            alert("Erro: ID inválido: idEnrollment=" + enrollment.idEnrollment + " id=" + enrollment.id)
            return
        }

        try {
            await withLoading('remove', async () => {
                // Pass full enrollment object so service can log cancellation if experimental
                await deleteEnrollment(idToDelete, { enrollmentData: enrollment })


                // Atualiza lista local
                setEnrollmentsState(prev =>
                    prev.filter(e => (e.idEnrollment || e.id) !== idToDelete)
                )
                toast.show({ title: "Matrícula removida", color: "success" })
            })
        } catch (err) {
            console.error("Erro ao remover matrícula", err)
            // Show explicit error to user so they can tell me
            const msg = err?.message || String(err)
            alert("Erro CRÍTICO ao remover: " + msg)
        }
    }

    const handleDeleteClient = async () => {
        if (!clientId) return
        try {
            await withLoading('delete', async () => {
                await deleteClient(clientId)
                toast.show({ title: "Cliente excluído", color: "success" })
                // Extract prefix (/:tenant/:branch) from current path to return to list
                const match = window.location.pathname.match(/^\/[^/]+\/[^/]+/)
                const prefix = match ? match[0] : ""
                navigate(`${prefix}/clients/list`)
            })
        } catch (e) {
            console.error("Erro ao excluir cliente", e)
            const message = e?.message || "Ocorreu um erro ao tentar excluir o cliente."
            // Try to extract clean message if it comes from Firebase "Error: ..."
            const cleanMessage = message.replace("FirebaseError: ", "")
            toast.show({ title: "Não é possível excluir", description: cleanMessage, color: "warning" })
        }
    }

    return {
        handleAvatarChange,
        handleSave,
        handleRemoveEnrollment,
        handleDeleteClient,
        isLoading,
        uploading,
        navigate
    }
}
