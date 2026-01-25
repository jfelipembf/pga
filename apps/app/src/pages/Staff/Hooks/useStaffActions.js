import { useNavigate } from "react-router-dom"
import { useToast } from "components/Common/ToastProvider"
import { useStaffPhotoUpload, updateStaff, deleteStaff } from "../../../services/Staff/index"
import { buildStaffPayload } from "@pga/shared"

export const useStaffActions = ({
    staffId,
    formData,
    setFormData,
    passwordForm,
    setPasswordForm,
    withLoading
}) => {
    const navigate = useNavigate()
    const toast = useToast()
    const { uploadPhoto, uploading } = useStaffPhotoUpload()

    const handleSave = async () => {
        if (!formData) return

        // Validate password if provided
        if (passwordForm.next || passwordForm.confirm) {
            if (passwordForm.next !== passwordForm.confirm) {
                toast.show({ title: "Erro", description: "As senhas não conferem.", color: "warning" })
                return
            }
        }

        try {
            await withLoading('save', async () => {
                let photoUrl = formData.photo
                if (formData.avatarFile) {
                    // Upload new photo and delete old one automatically
                    const oldPhotoUrl = formData.photo
                    photoUrl = await uploadPhoto(formData.avatarFile, {
                        deleteOldPhoto: oldPhotoUrl
                    })
                }

                const rawPayload = { ...formData, photo: photoUrl }
                // Remove legacy fields if they exist before builder handles it
                delete rawPayload.avatarFile
                delete rawPayload.avatar

                const payload = buildStaffPayload(rawPayload)
                payload.id = staffId

                // Add password to payload if provided
                if (passwordForm.next) {
                    payload.password = passwordForm.next
                }

                await updateStaff(payload)

                // Merge payload with previous data and clear avatarFile to prevent re-upload
                setFormData(prev => {
                    const next = { ...prev, ...payload }
                    delete next.avatarFile
                    delete next.password // Don't store password in state
                    return next
                })

                // Clear password fields after successful save
                if (passwordForm.next) {
                    setPasswordForm({ next: "", confirm: "" })
                }

                toast.show({ title: "Sucesso", description: "Dados atualizados com sucesso.", color: "success" })
            })
        } catch (e) {
            console.error('Erro ao salvar colaborador', e)
            toast.show({ title: "Erro", description: "Falha ao salvar dados.", color: "danger" })
        }
    }

    const handleDeleteStaff = async () => {
        if (!staffId) return
        try {
            await withLoading('delete', async () => {
                await deleteStaff(staffId)
                toast.show({ title: "Colaborador excluído", color: "success" })
                navigate("../Staff/list")
            })
        } catch (e) {
            console.error("Erro ao excluir colaborador", e)
            const message = e?.message || "Ocorreu um erro ao tentar excluir o colaborador."
            const cleanMessage = message.replace("FirebaseError: ", "")
            toast.show({ title: "Não é possível excluir", description: cleanMessage, color: "warning" })
        }
    }

    return {
        handleSave,
        handleDeleteStaff,
        uploading
    }
}
