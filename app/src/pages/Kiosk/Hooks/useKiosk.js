import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useToast } from "../../../components/Common/ToastProvider"

export const useKiosk = () => {
    const { tenant: tenantSlug, branch: branchSlug } = useParams()
    const toast = useToast()
    const db = getFirestore()

    // Context State
    const [ids, setIds] = useState({ idTenant: null, idBranch: null })
    const [loadingIds, setLoadingIds] = useState(true)

    // Data State
    const [clients, setClients] = useState([])
    const [loadingClients, setLoadingClients] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedClient, setSelectedClient] = useState(null)
    const [evaluations, setEvaluations] = useState([])
    const [loadingEvaluations, setLoadingEvaluations] = useState(false)

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

    // Fetch Clients when Context is Ready
    useEffect(() => {
        const fetchClients = async () => {
            if (!ids.idTenant || !ids.idBranch) return

            setLoadingClients(true)
            try {
                // IMPORTANT: Re-importing inside the effect to avoid top-level issues if any
                const { listClientsRepo } = require("../../../services/Clients/clients.repository")

                const allClients = await listClientsRepo({ idTenant: ids.idTenant, idBranch: ids.idBranch })
                setClients(allClients)

            } catch (err) {
                console.error("Error fetching clients:", err)
                toast.show({ title: "Erro", description: "Erro ao buscar alunos.", color: "danger" })
            } finally {
                setLoadingClients(false)
            }
        }

        fetchClients()
    }, [ids, toast])

    // Filter Clients
    const filteredClients = useMemo(() => {
        if (!searchTerm) return []
        const lower = searchTerm.toLowerCase()
        return clients.filter(c => {
            const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase()
            return fullName.includes(lower)
        }).slice(0, 5) // Limit results
    }, [clients, searchTerm])

    // Effect to fetch evaluations when client is selected
    // Derived Activity Name
    const activityName = selectedClient?.activity || selectedClient?.activityName || "Sem matrícula ativa"
    // Fallback: If user hasn't migrated data yet, we could keep the old fetch, but user requested direct link.
    // We will trust the user has/will populate this field.

    // Effect to fetch evaluations when client is selected
    useEffect(() => {
        const fetchEvaluations = async () => {
            if (!selectedClient?.id) {
                setEvaluations([])
                return
            }

            setLoadingEvaluations(true)
            try {
                const { getClientEvaluations } = require("../../../services/ClientsEvaluation/clientsEvaluation.service")
                const evals = await getClientEvaluations({
                    idClient: selectedClient.id,
                    ctxOverride: { idTenant: ids.idTenant, idBranch: ids.idBranch } // FIX: Pass manual context
                })

                const getDate = (e) => {
                    if (e.startAt) return new Date(e.startAt).getTime()
                    if (e.createdAt?.seconds) return e.createdAt.seconds * 1000
                    return 0
                }

                const sortedEvals = (evals || []).sort((a, b) => getDate(b) - getDate(a))
                setEvaluations(sortedEvals)

            } catch (error) {
                console.error("Erro ao buscar avaliações no Kiosk:", error)
            } finally {
                setLoadingEvaluations(false)
            }
        }

        fetchEvaluations()
    }, [selectedClient, ids.idBranch, ids.idTenant])

    // State for Levels Config
    const [levelsConfig, setLevelsConfig] = useState([])

    // Fetch Levels Config
    // Fetch Levels Config
    useEffect(() => {
        const fetchLevels = async () => {
            if (!ids.idTenant || !ids.idBranch) return // Wait for context

            try {
                const { listEvaluationLevels } = require("../../../services/EvaluationLevels")
                const levels = await listEvaluationLevels({
                    ctxOverride: { idTenant: ids.idTenant, idBranch: ids.idBranch } // FIX: Pass manual context
                })
                if (Array.isArray(levels)) {
                    // Sort by value just in case
                    setLevelsConfig(levels.sort((a, b) => a.value - b.value))
                }
            } catch (err) {
                console.error("Erro ao buscar configuração de níveis:", err)
            }
        }
        fetchLevels()
    }, [ids]) // Depend on ids

    const handleSelectClient = (client) => {
        setSelectedClient(client)
        setSearchTerm("")
    }

    const handleClearSelection = () => {
        setSelectedClient(null)
        setEvaluations([])
        setSearchTerm("")
    }

    return {
        ids,
        loadingIds,
        loadingClients,
        searchTerm,
        setSearchTerm,
        filteredClients,
        selectedClient,
        evaluations,
        activityName,
        loadingEvaluations,
        levelsConfig, // Expose config
        handleSelectClient,
        handleClearSelection
    }
}
