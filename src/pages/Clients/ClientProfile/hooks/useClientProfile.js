import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import { useTenant } from "../../../../hooks/useTenant"
import { useAuth } from "../../../../hooks/useAuth"
import { ClientService } from "../../../../services/Clients"
import { ClientSchema } from "../../../../data/schemas/Clients/ClientSchema"
import { toast } from "react-toastify"
import { PROFILE_TABS } from "../constants/profileConstants"
import { usePhotoUpload } from "../../../../hooks/usePhotoUpload"

/**
 * Hook para gerenciar a lógica da página de Perfil do Cliente.
 */
export const useClientProfile = () => {
    // 1. Contexto e Parâmetros
    const { id } = useParams()
    const { idTenant, idBranch } = useTenant()
    const { user } = useAuth()
    const navigate = useNavigate()

    // 2. Estado Local
    const [client, setClient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(PROFILE_TABS.SUMMARY)
    const [isDeleting, setIsDeleting] = useState(false)

    // Hook de Upload de Foto
    const {
        selectedFile,
        preview: photoPreview,
        setPhotoDirectly,
        uploadPhoto,
        updatePreview
    } = usePhotoUpload()

    // 3. Formik para edição do perfil
    const formik = useFormik({
        initialValues: {
            firstName: "",
            lastName: "",
            birthDate: "",
            gender: "unspecified",
            cpf: "",
            email: "",
            phone: "",
            zipCode: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "SP",
            emergencyName: "",
            emergencyPhone: "",
            emergencyEmail: "",
            healthObservations: ""
        },
        validationSchema: ClientSchema,
        onSubmit: async (values) => {
            if (!idTenant || !idBranch) {
                toast.warning("Aguarde o carregamento do contexto.")
                return;
            }

            try {
                const userName = user?.displayName || user?.email || 'Usuário Sistema';
                const userId = user?.uid || 'system';

                let photoUrl = client?.photoUrl || null;

                // 1. Se houver novo arquivo selecionado, faz upload
                if (selectedFile) {
                    photoUrl = await uploadPhoto({
                        idTenant,
                        idBranch,
                        entityType: "clients",
                        entityId: id,
                        currentPhotoUrl: client?.photoUrl
                    });
                }

                const finalValues = {
                    ...values,
                    firstName: values.firstName?.trim().toUpperCase(),
                    lastName: values.lastName?.trim().toUpperCase(),
                    email: values.email?.trim().toLowerCase(),
                    photoUrl: photoUrl
                };

                await ClientService.updateClient(idTenant, idBranch, userId, id, {
                    ...finalValues,
                    userName
                });

                toast.success("Perfil atualizado com sucesso!");
                loadClient(); // Recarrega dados
            } catch (error) {
                console.error("Erro ao salvar perfil:", error);
                toast.error(error.message || "Erro ao salvar alterações.");
            }
        }
    });

    // 4. Carregar dados do cliente
    const loadClient = useCallback(async () => {
        // Validação de Contexto
        if (!idTenant || !idBranch || !id) {
            return;
        }

        try {
            setLoading(true)


            const data = await ClientService.getClientById(idTenant, idBranch, id)

            if (!data) {
                console.error(`[useClientProfile] Cliente ${id} não encontrado.`);
                toast.error("Cliente não encontrado.")
                setLoading(false);
                return;
            }

            setClient(data)
            updatePreview(data.photoUrl)

            // Atualiza valores do formulário
            formik.setValues({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                birthDate: data.birthDate || "",
                gender: data.gender || "unspecified",
                cpf: data.cpf || "",
                email: data.email || "",
                phone: data.phone || "",
                zipCode: data.address?.zipCode || "",
                street: data.address?.street || "",
                number: data.address?.number || "",
                complement: data.address?.complement || "",
                neighborhood: data.address?.neighborhood || "",
                city: data.address?.city || "",
                state: data.address?.state || "SP",
                emergencyName: data.emergencyContact?.name || "",
                emergencyPhone: data.emergencyContact?.phone || "",
                emergencyEmail: data.emergencyContact?.email || "",
                healthObservations: data.healthObservations || ""
            });

        } catch (error) {
            console.error("Erro ao carregar perfil do cliente:", error)
            toast.error("Erro ao carregar dados do cliente.")
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idTenant, idBranch, id])

    // 5. Deletar cliente
    const deleteClient = async () => {
        if (!idTenant || !idBranch) return

        try {
            setIsDeleting(true)
            const userName = user?.displayName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email) || 'Usuário Atual';
            const userId = user?.uid || 'system';

            await ClientService.deleteClient(idTenant, idBranch, userId, id, userName)
            toast.success("Cliente excluído com sucesso.")
            navigate(-1)
        } catch (error) {
            console.error("Erro ao excluir cliente:", error)
            toast.error(error.message || "Erro ao excluir cliente.")
        } finally {
            setIsDeleting(false)
        }
    }

    // 6. Efeito para carregar dados
    useEffect(() => {
        if (idTenant && idBranch && id) {
            loadClient()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idTenant, idBranch, id, loadClient])


    // 7. Atualizar foto individualmente (Header)
    const handleUpdatePhoto = async (file) => {
        if (!file || !idTenant || !idBranch || !id) return;

        try {
            // Faz upload direto usando StorageService
            const { StorageService } = await import("../../../../services/Core/StorageService");
            const url = await StorageService.uploadProfileImage(file, {
                idTenant,
                idBranch,
                entityType: "clients",
                entityId: id,
                currentPhotoUrl: client?.photoUrl
            });

            if (url) {
                // Extrai o descriptor facial para reconhecimento no Kiosk
                let faceDescriptor = null;
                try {
                    const { FaceRecognitionService } = await import("../../../../services/FaceRecognition/FaceRecognitionService");
                    await FaceRecognitionService.loadModels();
                    faceDescriptor = await FaceRecognitionService.getDescriptorFromFile(file);

                    if (!faceDescriptor) {
                        toast.warning("Nenhum rosto detectado na foto. A identificação facial pode não funcionar no Quiosque.");
                    } else {
                        console.log(`[ClientProfile] Descriptor facial extraído com sucesso (${faceDescriptor.length}D)`);
                    }
                } catch (faceErr) {
                    console.warn("[ClientProfile] Erro ao extrair descriptor facial:", faceErr);
                    // Não impede o salvamento - a foto é salva sem descriptor
                }

                // Atualiza APENAS os campos de foto/face no Firestore (via repository)
                // Evita passar por ClientSchema.validate que exige firstName, lastName, etc.
                const { clientRepository } = await import("../../../../data/repositories/ClientRepository");
                const updatePayload = {
                    photoUrl: url,
                    ...(faceDescriptor ? { faceDescriptor: faceDescriptor } : {})
                };
                await clientRepository.update(idTenant, idBranch, id, updatePayload);

                setClient(prev => ({ ...prev, photoUrl: url, faceDescriptor }));
                updatePreview(url);
                toast.success("Foto de perfil atualizada!");
            }
        } catch (error) {
            console.error("Erro ao atualizar foto:", error);
            toast.error("Erro ao atualizar foto.");
        }
    };

    return {
        client,
        loading,
        activeTab,
        setActiveTab,
        refreshData: loadClient,
        handleDelete: deleteClient,
        isDeleting,
        idTenant,
        idBranch,
        formik,
        photoPreview,
        setPhotoDirectly,
        handleUpdatePhoto // Exporting the new handler
    }
}
