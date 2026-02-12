import { useFormik } from "formik"
import { toast } from "react-toastify"
import { getAuth } from "firebase/auth"

import { useTenant } from "../../../hooks/useTenant"

import { ClientService } from "../../../services/Clients"
import { ClientSchema } from "../../../data/schemas/Clients/ClientSchema"
import { useAddressLookup } from "../../../hooks/useAddressLookup"
import { usePhotoUpload } from "../../../hooks/usePhotoUpload"

export const useClientForm = ({ onClientAdded, toggle }) => {
    // Obter IDs reais via Hook Centralizado
    const { idTenant, idBranch } = useTenant()

    const {
        selectedFile,
        preview: photoPreview,
        handlePhotoChange,
        uploadPhoto,
        resetPhoto
    } = usePhotoUpload()

    const auth = getAuth()

    const formik = useFormik({
        initialValues: {
            // Dados Pessoais
            firstName: "",
            lastName: "",
            birthDate: "",
            gender: "unspecified",
            cpf: "",
            email: "",
            phone: "",

            // Endereço
            zipCode: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "SP",

            // Emergência
            emergencyName: "",
            emergencyPhone: "",
            emergencyEmail: "",

            // Saúde
            healthObservations: "",

            status: "lead"
        },
        validationSchema: ClientSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                if (!auth.currentUser) {
                    toast.error("Usuário não autenticado")
                    return
                }

                let photoUrl = ""

                // 1. Upload da Foto
                if (selectedFile) {
                    photoUrl = await uploadPhoto({
                        idTenant,
                        idBranch,
                        entityType: "clients",
                        entityId: "temp-" + Date.now(),
                        currentPhotoUrl: null
                    })
                }

                // 2. Preparar dados finais
                const user = auth.currentUser || {};
                const finalValues = {
                    ...values,
                    firstName: values.firstName?.trim().toUpperCase(),
                    lastName: values.lastName?.trim().toUpperCase(),
                    email: values.email?.trim().toLowerCase(),
                    photoUrl: photoUrl || null,
                    userName: user.displayName || user.email // Garante Snapshot
                }

                // 3. Salvar
                const newClient = await ClientService.createClient(idTenant, idBranch, auth.currentUser.uid, finalValues)

                toast.success("Cliente cadastrado com sucesso!")
                onClientAdded?.(newClient)
                resetForm()
                resetPhoto()
                toggle()

            } catch (error) {
                console.error("Erro ao salvar cliente:", error)
                toast.error("Erro ao cadastrar cliente.")
            } finally {
                setSubmitting(false)
            }
        }
    })

    const { isLoadingCep, handleCepBlur } = useAddressLookup(formik)

    return {
        formik,
        photoPreview,
        handlePhotoChange,
        isLoadingCep,
        handleCepBlur
    }
}
