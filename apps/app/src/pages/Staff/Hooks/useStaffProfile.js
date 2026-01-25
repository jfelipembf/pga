import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useToast } from "components/Common/ToastProvider"
import { useLoading } from "../../../hooks/useLoading"
import { getStaff } from "../../../services/Staff/index"
import { listRoles } from "../../../services/Roles/roles.service"
import { PLACEHOLDER_AVATAR } from "../../Clients/Constants/defaults"

export const useStaffProfile = () => {
    const [searchParams] = useSearchParams()
    const staffId = searchParams.get("id")
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()

    const [formData, setFormData] = useState(null)
    const [roles, setRoles] = useState([])
    const [activeTab, setActiveTab] = useState("Perfil")

    // Derived state for password change fields
    const [passwordForm, setPasswordForm] = useState({
        next: "",
        confirm: "",
    })

    const [menuOpen, setMenuOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)

    // Initial role fetch
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await listRoles()
                setRoles(data)
            } catch (error) {
                console.error("Erro ao carregar funções:", error)
            }
        }
        fetchRoles()
    }, [])

    // Load Staff Data
    useEffect(() => {
        if (!staffId) return

        const loadStaff = async () => {
            try {
                await withLoading('page', async () => {
                    const data = await getStaff(staffId)
                    if (data) {
                        setFormData({
                            ...data,
                            firstName: data.firstName || "",
                            lastName: data.lastName || "",
                            email: data.email || "",
                            phone: data.phone || "",
                            role: data.role || "",
                            status: data.status || "active",
                            avatar: data.avatar || null,
                            isInstructor: !!data.isInstructor
                        })
                    }
                })
            } catch (error) {
                console.error("Erro ao carregar colaborador:", error)
                toast.show({ title: "Erro", description: "Não foi possível carregar os dados.", color: "danger" })
            }
        }
        loadStaff()
    }, [staffId, toast, withLoading])

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updatePasswordField = (field, value) => {
        setPasswordForm(prev => ({ ...prev, [field]: value }))
    }

    // Computed Profile Object (View Model)
    const profile = formData ? {
        name: `${formData.firstName} ${formData.lastName}`,
        id: formData.id || "N/A",
        status: formData.status,
        photo: formData.photo || PLACEHOLDER_AVATAR,
    } : null

    return {
        staffId,
        formData,
        setFormData,
        passwordForm, // passed to form
        setPasswordForm, // potentially needed
        updateField,
        updatePasswordField,
        roles,
        activeTab,
        setActiveTab,
        menuOpen,
        setMenuOpen,
        deleteModalOpen,
        setDeleteModalOpen,
        isLoading,
        withLoading,
        profile
    }
}
