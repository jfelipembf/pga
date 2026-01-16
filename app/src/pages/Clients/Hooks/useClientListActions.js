import { useState, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useToast } from "../../../components/Common/ToastProvider"
import { useLoading } from "../../../hooks/useLoading"
import { useClientAvatarUpload, createClient } from "../../../services/Clients/index"
import { buildClientPayload } from "../../../services/payloads"

export const useClientListActions = ({ setClients }) => {
    const [modalOpen, setModalOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { uploadAvatar, uploading } = useClientAvatarUpload()
    const toast = useToast()
    const { withLoading, isLoading } = useLoading()

    const profilePath = useMemo(() => {
        if (location.pathname.endsWith("/list")) {
            return location.pathname.replace(/\/list$/, "/profile")
        }
        return "/clients/profile"
    }, [location.pathname])

    const handleModalSubmit = data => {
        const save = async () => {
            try {
                await withLoading('submit', async () => {
                    let avatarUrl = data.avatar // or data.photo if form updated... assuming data.avatar for now from legacy form
                    if (data.avatarFile) {
                        const res = await uploadAvatar(data.avatarFile)
                        // Handle both string and object return types from upload service
                        avatarUrl = typeof res === 'object' && res?.url ? res.url : res
                    }

                    const rawPayload = {
                        ...data,
                        photo: avatarUrl, // Strict photo
                        // Remove legacy fields so builder doesn't get confused if it blindly copies
                        avatar: undefined,
                        photoUrl: undefined,
                        avatarFile: undefined
                    }

                    const payload = buildClientPayload(rawPayload)

                    const created = await createClient(payload)
                    if (setClients) {
                        setClients(prev => [created, ...prev])
                    }
                    setModalOpen(false)
                    toast.show({ title: "Cliente criado", description: payload.name || payload.email, color: "success" })
                })
            } catch (e) {
                console.error("Erro ao criar cliente", e)
                toast.show({ title: "Erro ao criar cliente", description: e?.message || String(e), color: "danger" })
            }
        }
        save()
    }

    const handleRowClick = item => {
        navigate(`${profilePath}?id=${item.id}`)
    }

    return {
        modalOpen,
        setModalOpen,
        handleModalSubmit,
        handleRowClick,
        profilePath,
        uploading,
        isLoading: isLoading('submit')
    }
}
