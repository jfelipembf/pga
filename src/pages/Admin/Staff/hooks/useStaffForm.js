import { useState, useMemo } from "react"
import { useFormik } from "formik"
import { toast } from "react-toastify"
import { useTenant } from "../../../../hooks/useTenant"
import { StaffSchema } from "../../../../data/schemas/Admin/StaffSchema"
import { StaffService } from "../../../../services/Admin/StaffService"
import { StorageService } from "../../../../services/Core/StorageService"
import { getAddressByCep } from "../../../../services/External/AddressService"

export const useStaffForm = ({ onStaffAdded, toggle, roles }) => {
    const { idTenant, idBranch } = useTenant()
    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [isLoadingCep, setIsLoadingCep] = useState(false)

    const user = useMemo(() => {
        const authUser = localStorage.getItem("authUser")
        return authUser ? JSON.parse(authUser) : null
    }, [])

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

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            phone: "",
            document: "", // CPF ou RG
            cpf: "",
            roleId: "",
            roleName: "",
            birthDate: "",
            hireDate: new Date().toISOString().split('T')[0],
            status: "active",
            isActive: true
        },
        validationSchema: StaffSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                if (!user) {
                    toast.error("Usuário não autenticado")
                    return
                }

                let photoUrl = ""

                // 1. Upload da Foto se houver
                if (selectedPhoto) {
                    photoUrl = await StorageService.uploadFile(selectedPhoto, `staff/profile_${Date.now()}`)
                }

                // 2. Buscar o nome do cargo selecionado para o Snapshot
                const selectedRole = roles.find(r => r.id === values.roleId)

                // 3. Salvar
                await StaffService.createStaff(idTenant, idBranch, user.uid, {
                    ...values,
                    photo: photoUrl || null,
                    roleName: selectedRole ? (selectedRole.name || selectedRole.label) : "",
                    createdByUserName: user.displayName || user.email
                })

                toast.success("Colaborador cadastrado com sucesso!")
                onStaffAdded?.()
                resetForm()
                setSelectedPhoto(null)
                toggle()

            } catch (error) {
                console.error("Erro ao salvar colaborador:", error)
                toast.error(error.message || "Erro ao cadastrar colaborador.")
            } finally {
                setSubmitting(false)
            }
        }
    })

    const handleCepBlur = async (e) => {
        // Implementar se Staff precisar de endereço detalhado como os Clientes
        // Por enquanto seguiremos o schema definido
    }

    return {
        formik,
        photoPreview,
        handlePhotoChange,
        isLoadingCep,
        handleCepBlur
    }
}
