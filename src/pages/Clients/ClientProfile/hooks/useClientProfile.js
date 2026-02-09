import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import { useTenant } from "../../../../hooks/useTenant"
import { ClientService } from "../../../../services/Clients"
import { ClientSchema } from "../../../../data/schemas/Clients/ClientSchema"
import { toast } from "react-toastify"
import { PROFILE_TABS } from "../constants/profileConstants"

/**
 * Hook para gerenciar a lógica da página de Perfil do Cliente.
 */
export const useClientProfile = () => {
    const { id } = useParams()
    const { idTenant, idBranch, user } = useTenant()

    const navigate = useNavigate()

    const [client, setClient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(PROFILE_TABS.SUMMARY)
    const [isDeleting, setIsDeleting] = useState(false)

    // Formik para edição do perfil
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
            try {
                const userName = user?.displayName || user?.email || 'Usuário Sistema';
                await ClientService.updateClient(idTenant, idBranch, user.uid, id, {
                    ...values,
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

    // Carregar dados do cliente
    const loadClient = useCallback(async () => {
        if (!idTenant || !idBranch || !id) return

        try {
            setLoading(true)
            const data = await ClientService.getClientById(idTenant, idBranch, id)
            if (!data) {
                toast.error("Cliente não encontrado.")
                navigate(-1)
                return
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
    }, [idTenant, idBranch, id, navigate, formik])

    // Deletar cliente
    const deleteClient = async () => {
        if (!idTenant || !idBranch) return

        try {
            setIsDeleting(true)
            const userName = user?.displayName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email) || 'Usuário Atual';
            await ClientService.deleteClient(idTenant, idBranch, user?.uid, id, userName)
            toast.success("Cliente excluído com sucesso.")
            navigate(-1)
        } catch (error) {
            console.error("Erro ao excluir cliente:", error)
            toast.error(error.message || "Erro ao excluir cliente.")
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        if (idTenant && idBranch && id) {
            loadClient()
        }
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
