import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import { useTenant } from "../../../../hooks/useTenant"
import { useAuth } from "../../../../hooks/useAuth"
import { ClientService } from "../../../../services/Clients"
import { ClientSchema } from "../../../../data/schemas/Clients/ClientSchema"
import { toast } from "react-toastify"
import { PROFILE_TABS } from "../constants/profileConstants"

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

                const finalValues = {
                    ...values,
                    firstName: values.firstName?.trim().toUpperCase(),
                    lastName: values.lastName?.trim().toUpperCase(),
                    email: values.email?.trim().toLowerCase()
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
                // Opcional: Redirecionar, mas cuidado com loops
                // navigate(-1) 
                setLoading(false);
                return;
            }

            setClient(data)

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
        formik
    }
}
