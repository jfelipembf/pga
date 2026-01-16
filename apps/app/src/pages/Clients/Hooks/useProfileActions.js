import { useNavigate } from "react-router-dom"
import { useClientAvatarUpload, updateClient as updateClientAction } from "../../../services/Clients/index"
import { buildClientPayload } from "../../../services/payloads"
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
                    const res = await uploadAvatar(formData.avatarFile)
                    photoUrl = res
                }

                // Use builder to enforce strict consistency (Schema)
                const rawData = { ...formData, photo: photoUrl }
                const payload = buildClientPayload(rawData)

                await updateClientAction(clientId, payload)

                setFormData(payload)
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

    return {
        handleAvatarChange,
        handleSave,
        handleRemoveEnrollment,
        isLoading,
        uploading,
        navigate
    }
}
