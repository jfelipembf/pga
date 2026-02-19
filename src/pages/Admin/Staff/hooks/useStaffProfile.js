import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAuth } from "firebase/auth"
import { useTenant } from '../../../../hooks/useTenant'
import { useAddressLookup } from '../../../../hooks/useAddressLookup'
import { StaffService } from '../../../../services/Admin/StaffService'
import { RoleService } from '../../../../services/Admin/RoleService'
import { StorageService } from '../../../../services/Core/StorageService'
import { toast } from 'react-toastify'
import { useFormik } from 'formik'
import { StaffUpdateSchema } from '../../../../data/schemas/Admin/StaffSchema'
import { StaffMetricsService } from '../../../../services/Admin/StaffMetricsService'
import { useGrade } from '../../../../contexts/GradeContext'
import { useStaticData } from '../../../../contexts/StaticDataContext'

/**
 * Hook para gerenciar o perfil do colaborador.
 * Agora integrado com GradeContext e StaticDataContext para evitar buscas redundantes e manter sincronia.
 */
export const useStaffProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { idTenant, idBranch, tenantSlug, branchSlug } = useTenant()
    const auth = getAuth()

    // 1. Dados Globais (Contextos)
    const { sessions, loading: scheduleLoading } = useGrade()
    const { activities, areas, isLoading: staticLoading } = useStaticData()

    // 2. Estados Principais
    const [staff, setStaff] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("Perfil")
    const [roles, setRoles] = useState([])
    const [photoPreview, setPhotoPreview] = useState(null)
    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // 3. Agenda Filtrada do Professor
    const teacherSchedule = (Array.isArray(sessions) ? sessions : []).filter(s => String(s.idStaff) === String(id))

    // 4. Métricas
    const [metrics, setMetrics] = useState(null)
    const [metricsLoading, setMetricsLoading] = useState(false)

    const loadStaffData = useCallback(async () => {
        if (!id || !idTenant || !idBranch) return
        try {
            setLoading(true)
            const [staffData, rolesData] = await Promise.all([
                StaffService.findById(idTenant, idBranch, id),
                RoleService.listAll(idTenant, idBranch)
            ])

            if (!staffData) {
                toast.error("Colaborador não encontrado")
                navigate('/admin/staff')
                return
            }

            setStaff(staffData)
            setRoles(rolesData)
            setPhotoPreview(staffData.photo)
        } catch (error) {
            console.error("Erro ao carregar dados do colaborador:", error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }, [id, idTenant, idBranch, navigate])

    useEffect(() => {
        loadStaffData()
    }, [loadStaffData])

    const loadMetrics = useCallback(async () => {
        if (!id || !idTenant || !idBranch) return
        try {
            setMetricsLoading(true)
            const metricsData = await StaffMetricsService.getStaffMonthlyMetrics(idTenant, idBranch, id)
            setMetrics(metricsData)
        } catch (error) {
            console.error("Erro ao carregar métricas:", error)
        } finally {
            setMetricsLoading(false)
        }
    }, [id, idTenant, idBranch])

    useEffect(() => {
        if (activeTab === "Métricas") {
            loadMetrics()
        }
    }, [activeTab, loadMetrics])

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: staff?.name || '',
            email: staff?.email || '',
            phone: staff?.phone || '',
            cpf: staff?.cpf || '',
            roleId: staff?.roleId || '',
            status: staff?.status || 'active',
            birthDate: staff?.birthDate || '',
            hireDate: staff?.hireDate || '',
            photo: staff?.photo || '',
            professionalId: staff?.professionalId || '',
            salary: staff?.salary || '',
            zipCode: staff?.zipCode || '',
            street: staff?.street || '',
            number: staff?.number || '',
            complement: staff?.complement || '',
            neighborhood: staff?.neighborhood || '',
            city: staff?.city || '',
            state: staff?.state || '',
        },
        validationSchema: StaffUpdateSchema,
        onSubmit: async (values) => {
            try {
                if (!auth.currentUser) {
                    toast.error("Usuário não autenticado")
                    return
                }

                let finalPhotoUrl = values.photo

                if (selectedPhoto) {
                    finalPhotoUrl = await StorageService.uploadProfileImage(selectedPhoto, {
                        idTenant,
                        idBranch,
                        entityType: "staff",
                        entityId: id,
                        currentPhotoUrl: staff?.photo
                    })
                }

                const currentUserData = auth.currentUser || {}
                const { password, confirmPassword, ...updateData } = values

                const finalData = {
                    ...updateData,
                    photo: finalPhotoUrl,
                    userName: currentUserData.displayName || currentUserData.email
                }

                await StaffService.updateStaff(idTenant, idBranch, auth.currentUser.uid, id, finalData)
                toast.success("Perfil atualizado com sucesso")
                setSelectedPhoto(null)
                loadStaffData()
            } catch (error) {
                console.error("Erro ao atualizar colaborador:", error)
                toast.error("Erro ao atualizar: " + error.message)
            }
        }
    })

    const { isLoadingCep, handleCepBlur } = useAddressLookup(formik)

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedPhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDelete = () => setShowDeleteDialog(true)

    const handleConfirmDelete = async () => {
        try {
            if (!auth.currentUser) return
            setIsDeleting(true)
            await StaffService.deleteStaff(idTenant, idBranch, auth.currentUser.uid, id)
            toast.success("Colaborador excluído com sucesso")
            setShowDeleteDialog(false)
            navigate(`/${tenantSlug}/${branchSlug}/admin/staff`)
        } catch (error) {
            toast.error("Erro ao excluir: " + error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    const handlePasswordChange = async (newPassword) => {
        try {
            if (!auth.currentUser) return
            setIsChangingPassword(true)
            await StaffService.updatePassword(auth.currentUser.uid, id, newPassword)
            toast.success("Senha alterada com sucesso")
            return true
        } catch (error) {
            console.error("Erro ao alterar senha:", error)
            toast.error("Erro ao alterar senha: " + error.message)
            return false
        } finally {
            setIsChangingPassword(false)
        }
    }

    return {
        staff,
        loading,
        activeTab,
        setActiveTab,
        roles,
        formik,
        photoPreview,
        handlePhotoChange,
        handleDelete,
        handlePasswordChange,
        isChangingPassword,
        handleCepBlur,
        isLoadingCep,
        schedule: teacherSchedule,
        scheduleLoading: scheduleLoading || staticLoading,
        activities,
        areas,
        metrics,
        metricsLoading,
        loadMetrics,
        showDeleteDialog,
        setShowDeleteDialog,
        handleConfirmDelete,
        isDeleting,
        tenantSlug,
        branchSlug
    }
}
