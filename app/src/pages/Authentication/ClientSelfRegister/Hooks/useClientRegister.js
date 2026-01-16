import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useFormik } from "formik"

// Services & Helpers
import { createClient, useClientAvatarUpload } from "../../../../services/Clients/clients.service"
import { fetchAddressByCep } from "../../../../helpers/cep"
import { useToast } from "../../../../components/Common/ToastProvider"

// Constants
import { initialValues, validationSchema } from "../Constants/initialValue"

export const useClientRegister = () => {
    const { tenant: tenantSlug, branch: branchSlug } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const toast = useToast()
    const db = getFirestore()

    // Context State
    const [ids, setIds] = useState({ idTenant: null, idBranch: null })
    const [loadingIds, setLoadingIds] = useState(true)
    const [loading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Photo State
    const [preview, setPreview] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)
    const { uploadAvatar, uploading: uploadingPhoto } = useClientAvatarUpload()

    // Resolve Context (Tenant & Branch)
    useEffect(() => {
        const resolveContext = async () => {
            try {
                if (!tenantSlug || !branchSlug) return;
                setLoadingIds(true)

                // 1. Resolve Tenant Slug
                const tenantSlugDoc = await getDoc(doc(db, "tenantsBySlug", tenantSlug))
                if (!tenantSlugDoc.exists()) throw new Error("Academia não encontrada")
                const idTenant = tenantSlugDoc.data().idTenant

                // 2. Resolve Branch Slug
                const branchesRef = collection(db, "tenants", idTenant, "branches")
                const q = query(branchesRef, where("slug", "==", branchSlug))
                const querySnapshot = await getDocs(q)

                if (querySnapshot.empty) throw new Error("Unidade não encontrada")
                const idBranch = querySnapshot.docs[0].id

                setIds({ idTenant, idBranch })
            } catch (err) {
                console.error("Error resolving context:", err)
                toast.show({ title: "Erro", description: "Link inválido ou expirado.", color: "danger" })
            } finally {
                setLoadingIds(false)
            }
        }
        resolveContext()
    }, [tenantSlug, branchSlug, db, toast])

    // Form Handling
    const validation = useFormik({
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            if (!ids.idTenant || !ids.idBranch) {
                toast.show({ title: "Erro", description: "Contexto da academia não carregado.", color: "danger" })
                return
            }

            setLoading(true)
            try {
                let photoUrl = null
                // 1. Upload Photo (if selected)
                if (photoFile) {
                    photoUrl = await uploadAvatar(photoFile, {
                        ctxOverride: { idTenant: ids.idTenant, idBranch: ids.idBranch }
                    })
                }

                // 2. Create Client Document
                const clientData = {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    phone: values.phone,
                    gender: values.gender,
                    birthDate: values.birthDate,

                    address: {
                        zip: values.cep,
                        state: values.state,
                        city: values.city,
                        neighborhood: values.neighborhood,
                        address: values.address,
                        number: values.number
                    },

                    photo: photoUrl,
                    status: "lead"
                }

                await createClient(clientData, {
                    ctxOverride: { idTenant: ids.idTenant, idBranch: ids.idBranch }
                })

                toast.show({ title: "Cadastro realizado com sucesso!", description: "Seu cadastro foi recebido.", color: "success" })
                setIsSuccess(true)
                // setTimeout(() => {
                //     navigate(`/${tenantSlug}/${branchSlug}/login`)
                // }, 3000)

            } catch (err) {
                console.error("Erro no cadastro:", err)
                let message = err.message
                if (err.message && err.message.includes("already exists")) {
                    message = "Este cliente já está cadastrado."
                }
                toast.show({
                    title: "Erro ao realizar cadastro",
                    description: message || "Tente novamente.",
                    color: "danger"
                })
            } finally {
                setLoading(false)
            }
        }
    })

    // Address Lookup Handler
    const handleCepBlur = async (e) => {
        const cep = e.target.value.replace(/\D/g, "")
        if (cep.length === 8) {
            const addr = await fetchAddressByCep(cep)
            if (addr) {
                validation.setFieldValue("state", addr.state)
                validation.setFieldValue("city", addr.city)
                validation.setFieldValue("neighborhood", addr.neighborhood)
                validation.setFieldValue("address", addr.address)
            }
        }
        validation.handleBlur(e)
    }

    // Photo Handlers
    const handlePhotoClick = () => {
        fileInputRef.current.click()
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    return {
        ids,
        loadingIds,
        loading,
        isSuccess,
        uploadingPhoto,
        validation,
        photoState: {
            preview,
            photoFile,
            fileInputRef
        },
        handlers: {
            handlePhotoClick,
            handlePhotoChange,
            handleCepBlur
        }
    }
}
