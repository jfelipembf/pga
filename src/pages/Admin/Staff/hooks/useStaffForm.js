import { useFormik } from "formik"
import { toast } from "react-toastify"
import { useTenant } from "../../../../hooks/useTenant"
import { StaffSchema } from "../../../../data/schemas/Admin/StaffSchema"
import { StaffService } from "../../../../services/Admin/StaffService"
import { usePhotoUpload } from "../../../../hooks/usePhotoUpload"
import { useCurrentUser } from "../../../../hooks/useCurrentUser"

export const useStaffForm = ({ onStaffAdded, toggle, roles }) => {
    const { idTenant, idBranch } = useTenant()

    // Hook centralizado de uploads
    const {
        selectedFile,
        preview: photoPreview,
        handlePhotoChange,
        uploadPhoto,
        resetPhoto
    } = usePhotoUpload()

    const user = useCurrentUser()

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
                if (selectedFile) {
                    photoUrl = await uploadPhoto({
                        idTenant,
                        idBranch,
                        entityType: "staff",
                        entityId: "new-" + Date.now(),
                        currentPhotoUrl: null
                    })
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
                resetPhoto()
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
        handleCepBlur
    }
}
