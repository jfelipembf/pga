import { useState, useEffect, useCallback } from "react"
import { getFirebaseFunctions } from "../../../../helpers/firebase_helper"
import { httpsCallable } from "firebase/functions"
import { useToast } from "../../../../components/Common/ToastProvider"
import { useSelector } from "react-redux"

const { TRIGGER_LABELS } = require("../constants/triggers")

export const useAutomations = () => {
    const { tenant } = useSelector(state => state.Tenant)
    const { idBranch } = useSelector(state => state.Branch)
    const idTenant = tenant?.idTenant || tenant?.id || localStorage.getItem("idTenant")

    const [automations, setAutomations] = useState([])
    const [loading, setLoading] = useState(false)
    const toast = useToast()


    const fetchAutomations = useCallback(async () => {
        if (!idTenant || !idBranch) return
        setLoading(true)
        try {
            const functions = getFirebaseFunctions()
            const getAutomationsFunc = httpsCallable(functions, "getAutomations")
            const result = await getAutomationsFunc({ idTenant, idBranch })
            const remoteAutomations = result.data.data || []

            // Merge remote data with static list
            // We want to show ALL triggers defined in TRIGGER_LABELS
            const merged = Object.entries(TRIGGER_LABELS).map(([key, label]) => {
                const found = remoteAutomations.find(a => a.type === key)
                return found || {
                    id: `temp_${key}`, // Temp ID until saved
                    type: key,
                    name: label, // Default name to label
                    active: false,
                    whatsappTemplate: "",
                    config: {},
                    isTemp: true // Flag to know if it exists in DB
                }
            })

            setAutomations(merged)
        } catch (error) {
            console.error("Error fetching automations:", error)
            toast.show({ title: "Erro", description: "Falha ao carregar automações.", color: "danger" })
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, toast])

    useEffect(() => {
        fetchAutomations()
    }, [fetchAutomations])

    const saveAutomation = async (data) => {
        try {
            const functions = getFirebaseFunctions()
            const saveFunc = httpsCallable(functions, "saveAutomation")

            // If it's a temp ID, remove it so backend creates a new ID (or uses type as ID if you prefer)
            // The backend `saveAutomation` likely handles ID generation if not provided.
            // If the user hasn't saved it before, it has a temp ID.

            const payload = {
                idTenant,
                idBranch,
                automationId: data.isTemp ? undefined : data.id,
                automationData: {
                    ...data,
                    isTemp: undefined // Clean up
                }
            }

            await saveFunc(payload)
            toast.show({ title: "Sucesso", description: "Configuração salva.", color: "success" })
            fetchAutomations() // Refresh to get active state and real ID
            return true
        } catch (error) {
            console.error(error)
            toast.show({ title: "Erro", description: error.message, color: "danger" })
            return false
        }
    }

    return {
        automations,
        loading,
        fetchAutomations,
        saveAutomation
    }
}
