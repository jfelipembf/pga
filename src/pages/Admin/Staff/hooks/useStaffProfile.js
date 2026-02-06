import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenant } from '../../../../hooks/useTenant'
import { StaffService } from '../../../../services/Admin/StaffService'
import { RoleService } from '../../../../services/Admin/RoleService'
import { ClassService } from '../../../../services/Classes/ClassService'
import { ActivityService } from '../../../../services/Admin/ActivityService'
import { AreaService } from '../../../../services/Admin/AreaService'
import { getFunctions, httpsCallable } from "firebase/functions"
import { toast } from 'react-toastify'
import { useFormik } from 'formik'
import { StaffSchema } from '../../../../data/schemas/Admin/StaffSchema'

export const useStaffProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { idTenant, idBranch } = useTenant()

    const [staff, setStaff] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("Perfil")
    const [roles, setRoles] = useState([])
    const [photoPreview, setPhotoPreview] = useState(null)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [schedule, setSchedule] = useState([])
    const [scheduleLoading, setScheduleLoading] = useState(false)
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])

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
            const [classesData, activitiesData, areasData] = await Promise.all([
                ClassService.listWithFilters(idTenant, idBranch, { idStaff: id }),
                ActivityService.listAll(idTenant, idBranch),
                AreaService.listAreas(idTenant, idBranch)
            ])

            // Filtrar classes do professor específico (caso o listWithFilters não filtre no banco)
            const teacherClasses = classesData.filter(c => c.idStaff === id)

            setSchedule(teacherClasses)
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

            // Novos campos
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
        validationSchema: StaffSchema, // Note: Schema might need adjustment for password being optional on edit
        onSubmit: async (values) => {
            try {
                const currentUser = JSON.parse(localStorage.getItem("authUser"))
                // Remove password fields if they haven't been changed (placeholder)
                const { password, confirmPassword, ...updateData } = values

                const finalData = {
                    ...updateData,
                    userName: currentUser.displayName || currentUser.email
                }

                // If password was changed (not the mask), we handle it differently 
                // but usually password update is a separate flow.
                // For now, let's just update the profile.

                await StaffService.updateStaff(idTenant, idBranch, currentUser.uid, id, finalData)
                toast.success("Perfil atualizado com sucesso")
                loadStaffData()
            } catch (error) {
                console.error("Erro ao atualizar colaborador:", error)
                toast.error("Erro ao atualizar: " + error.message)
            }
        }
    })

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result)
                formik.setFieldValue("photo", reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm("Tem certeza que deseja excluir este colaborador?")) return
        try {
            const currentUser = JSON.parse(localStorage.getItem("authUser"))
            await StaffService.deleteStaff(idTenant, idBranch, currentUser.uid, id)
            toast.success("Colaborador excluído com sucesso")
            navigate('/admin/staff')
        } catch (error) {
            toast.error("Erro ao excluir: " + error.message)
        }
    }

    const handlePasswordChange = async (newPassword) => {
        try {
            setIsChangingPassword(true)
            const functions = getFunctions()
            const updateUserPassword = httpsCallable(functions, 'updateUserPassword')
            await updateUserPassword({ uid: id, newPassword })
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
        schedule,
        scheduleLoading,
        activities,
        areas
    }
}
