import { useState } from "react"
import { useFormik } from "formik"
import { toast } from "react-toastify"
import { getAuth } from "firebase/auth"

import { useTenant } from "../../../hooks/useTenant"

import { ClientSchema, ClientService } from "../../../features/clients"
import { StorageService } from "../../../services/Storage/StorageService"
import { getAddressByCep } from "../../../services/External/AddressService"

export const useClientForm = ({ onClientAdded, toggle }) => {
    // Obter IDs reais via Hook Centralizado
    const { idTenant, idBranch } = useTenant()

    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [isLoadingCep, setIsLoadingCep] = useState(false)
    const auth = getAuth()

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
                if (selectedPhoto) {
                    photoUrl = await StorageService.uploadProfileImage(selectedPhoto, {
                        idTenant,
                        idBranch,
                        entityType: "clients",
                        entityId: "temp-" + Date.now(),
                        currentPhotoUrl: null
                    })
                }

                // 2. Sanitização (Evitar undefined no Firebase)
                const sanitize = (val) => val === undefined ? null : val

                // 3. Montar objeto final
                const {
                    zipCode, street, number, complement, neighborhood, city, state,
                    emergencyName, emergencyPhone, emergencyEmail,
                    firstName, lastName,
                    ...rest
                } = values

                const clientData = {
                    ...rest,
                    firstName: sanitize(firstName),
                    lastName: sanitize(lastName),
                    name: `${firstName} ${lastName}`.trim(),
                    photoUrl: photoUrl || null,
                    cpf: sanitize(rest.cpf),
                    gender: sanitize(rest.gender),
                    // Endereço aninhado
                    address: {
                        zipCode: sanitize(zipCode),
                        street: sanitize(street),
                        number: sanitize(number),
                        complement: sanitize(complement),
                        neighborhood: sanitize(neighborhood),
                        city: sanitize(city),
                        state: sanitize(state)
                    },
                    // Emergência aninhada
                    emergencyContact: {
                        name: sanitize(emergencyName),
                        phone: sanitize(emergencyPhone),
                        email: sanitize(emergencyEmail)
                    },
                    healthObservations: sanitize(rest.healthObservations)
                }

                // 4. Salvar
                const user = JSON.parse(localStorage.getItem("authUser")) || {};
                await ClientService.createClient(idTenant, idBranch, auth.currentUser.uid, {
                    ...clientData,
                    userName: user.displayName || user.email // Garante Snapshot
                })

                toast.success("Cliente cadastrado com sucesso!")
                onClientAdded?.()
                resetForm()
                setSelectedPhoto(null)
                toggle()

            } catch (error) {
                console.error("Erro ao salvar cliente:", error)
                toast.error("Erro ao cadastrar cliente.")
            } finally {
                setSubmitting(false)
            }
        }
    })

    const handleCepBlur = async (e) => {
        const cep = e.target.value
        if (!cep) return

        setIsLoadingCep(true)
        const address = await getAddressByCep(cep)
        setIsLoadingCep(false)

        if (address) {
            formik.setFieldValue("street", address.logradouro)
            formik.setFieldValue("neighborhood", address.bairro)
            formik.setFieldValue("city", address.localidade)
            formik.setFieldValue("state", address.uf)
            document.getElementById("number")?.focus()
        }
    }

    return {
        formik,
        photoPreview,
        handlePhotoChange,
        isLoadingCep,
        handleCepBlur
    }
}
