import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAuth } from "firebase/auth"
import { useTenant } from '../../../../hooks/useTenant'
import { useAddressLookup } from '../../../../hooks/useAddressLookup'
import { StaffService } from '../../../../services/Admin/StaffService'
import { RoleService } from '../../../../services/Admin/RoleService'
import { ClassService } from '../../../../services/Classes/ClassService'
import { ActivityService } from '../../../../services/Admin/ActivityService'
import { AreaService } from '../../../../services/Admin/AreaService'
import { StorageService } from '../../../../services/Core/StorageService'
import { toast } from 'react-toastify'
import { useFormik } from 'formik'
import { StaffUpdateSchema } from '../../../../data/schemas/Admin/StaffSchema'
import { StaffMetricsService } from '../../../../services/Admin/StaffMetricsService'
import moment from 'moment'

export const useStaffProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { idTenant, idBranch, tenantSlug, branchSlug } = useTenant()
    const auth = getAuth()

    const [staff, setStaff] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("Perfil")
    const [roles, setRoles] = useState([])
    const [photoPreview, setPhotoPreview] = useState(null)
    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)


    // Agenda
    const [schedule, setSchedule] = useState([])
    const [scheduleLoading, setScheduleLoading] = useState(false)
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])

    // Métricas
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

    const loadSchedule = useCallback(async () => {
        if (!id || !idTenant || !idBranch) return
        try {
            setScheduleLoading(true)

            // Definir o intervalo da semana atual (Segunda a Domingo)
            const today = moment()
            const startOfWeek = today.clone().startOf('isoWeek').format('YYYY-MM-DD')
            const endOfWeek = today.clone().endOf('isoWeek').format('YYYY-MM-DD')

            const [sessionsData, activitiesData, areasData] = await Promise.all([
                ClassService.listSessions(idTenant, idBranch, startOfWeek, endOfWeek),
                ActivityService.listAll(idTenant, idBranch),
                AreaService.listAreas(idTenant, idBranch)
            ])

            // Filtrar sessões do professor específico
            const teacherSessions = sessionsData.filter(s => s.idStaff === id)

            setSchedule(teacherSessions)
            setActivities(activitiesData)
            setAreas(areasData)
        } catch (error) {
            console.error("Erro ao carregar agenda:", error)
        } finally {
            setScheduleLoading(false)
        }
    }, [id, idTenant, idBranch])

    useEffect(() => {
        if (activeTab === "Agenda") {
            loadSchedule()
        }
    }, [activeTab, loadSchedule])

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

                // 1. Upload de Foto se houver nova selecionada
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

    const handleDelete = () => {
        setShowDeleteDialog(true)
    }

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
        schedule,
        scheduleLoading,
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
