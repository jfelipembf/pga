import { useState, useEffect, useMemo } from "react"
import { useParams, useLocation } from "react-router-dom"
import { getStatusLabel, getStatusColor } from "../../../helpers/status"
import { PLACEHOLDER_AVATAR } from "../Constants/defaults"
import directoryBg from "../../../assets/images/directory-bg.jpg"

export const useProfileLogic = ({ client, contracts, financial, enrollments, setBreadcrumbItems }) => {
    const { tenant, branch } = useParams()
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const clientId = searchParams.get("id")

    const [formData, setFormData] = useState({})
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [activeTab, setActiveTab] = useState("Perfil")
    const [enrollmentsState, setEnrollmentsState] = useState([])

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    // Breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { title: "Clientes", link: "/clients/list" },
            { title: "Perfil", link: "/clients/profile" },
        ]
        setBreadcrumbItems("Perfil do Cliente", breadcrumbs)
    }, [setBreadcrumbItems])

    // Sync client data
    useEffect(() => {
        if (client) {
            setFormData(client)
            setAvatarPreview(client.photo || null)
        }
    }, [client])

    // Sync enrollments
    useEffect(() => {
        setEnrollmentsState(enrollments || [])
    }, [enrollments])

    // Computed: Primary Contract
    const primaryContract = useMemo(() => {
        if (!contracts?.length) return null
        const normalized = contracts.filter(Boolean)
        if (!normalized.length) return null
        const active = normalized.find(
            contract => (contract.status || "").toLowerCase() === "active"
        )
        return active || normalized[0]
    }, [contracts])

    // Computed: Total Debt
    const totalDebt = useMemo(() => {
        if (!financial?.length) return 0
        return financial
            .filter(f => Number(f.pending || 0) > 0)
            .reduce((acc, cur) => acc + Number(cur.pending || 0), 0)
    }, [financial])

    const formatCurrency = value =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))

    const contractStatusValue = (primaryContract?.status || "").toLowerCase() || null

    const profile = {
        name: `${formData.firstName || ""} ${formData.lastName || ""} `.trim() || "Cliente",
        id: formData.idGym || "--",
        status:
            (contractStatusValue && getStatusLabel(primaryContract.status, "contract")) ||
            getStatusLabel(formData.status, "client") ||
            "Ativo",
        statusColor:
            (contractStatusValue && getStatusColor(primaryContract.status)) ||
            getStatusColor(formData.status) ||
            "success",
        photo: avatarPreview || PLACEHOLDER_AVATAR,
        cover: directoryBg,
    }

    return {
        tenant,
        branch,
        clientId,
        location,
        formData,
        setFormData,
        avatarPreview,
        setAvatarPreview,
        activeTab,
        setActiveTab,
        enrollmentsState,
        setEnrollmentsState,
        updateField,
        primaryContract,
        totalDebt,
        formatCurrency,
        contractStatusValue,
        profile,
        directoryBg
    }
}
