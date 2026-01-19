import { useState, useMemo, useEffect, useCallback } from "react"
import { listReceivables } from "../../../../services/Receivables/receivables.service"
import { listFinancialTransactions } from "../../../../services/Financial/financial.service"
import { listClients } from "../../../../services/Clients/clients.service"
import { RECEIVABLE_STATUS } from "../Constants/receivablesConstants"

export const useReceivables = () => {
    // Filters State
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split("T")[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            .toISOString()
            .split("T")[0],
        status: "", // all
        search: "",
        clientId: null, // Specific client filter
    })

    // Data State
    const [receivables, setReceivables] = useState([])
    const [allClients, setAllClients] = useState([]) // For autocomplete
    const [loading, setLoading] = useState(false)

    // Client Search State
    const [clientSearchText, setClientSearchText] = useState("")
    const [selectedClient, setSelectedClient] = useState(null)

    // Actions
    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    // Initialize - Fetch Clients for Autocomplete
    useEffect(() => {
        const loadClients = async () => {
            try {
                const clients = await listClients()
                setAllClients(clients)
            } catch (err) {
                console.error("Error loading clients for filter", err)
            }
        }
        loadClients()
    }, [])

    // Fetch Receivables + Transactions
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // 1. Fetch Receivables (Debts/Open amounts)
            const receivablesPromise = listReceivables({
                startDate: filters.startDate,
                endDate: filters.endDate,
                status: filters.status === "" ? null : filters.status
            })

            // 2. Fetch Future Transactions (Credit Card Installments - considered "receivables" in this view)
            // We fetch transactions of type 'sale' in the date range.
            const transactionsPromise = listFinancialTransactions({
                dateRange: { start: filters.startDate, end: filters.endDate },
                type: "sale",
                limit: 1000 // reasonable limit
            })

            const [receivablesData, transactionsData] = await Promise.all([
                receivablesPromise,
                transactionsPromise
            ])

            // 3. Normalize Transactions and Receivables
            // Helper to get client name
            const getClientName = (id, fallback) => {
                const client = allClients.find(c => String(c.id) === String(id))
                return client ? client.name : (fallback || "Cliente Desconhecido")
            }

            const normalizedReceivables = receivablesData.map(r => ({
                ...r,
                clientName: r.clientName || getClientName(r.idClient, "Cliente Sem Nome"),
                // Ensure other fields are present if needed
                description: r.description || "Recebível",
                isTransaction: false
            }))

            const normalizedTransactions = transactionsData.map(tx => {
                const isFuture = tx.date > new Date().toISOString().split("T")[0]
                const computedStatus = isFuture ? RECEIVABLE_STATUS.OPEN : RECEIVABLE_STATUS.PAID

                return {
                    id: tx.id,
                    idClient: tx.idClient,
                    clientName: tx.metadata?.clientName || tx.clientName || getClientName(tx.idClient, "Cliente"),
                    description: `${tx.description || "Venda"} (Cartão)`,
                    dueDate: tx.date,
                    amount: tx.amount,
                    status: computedStatus,
                    form: tx.method,
                    isTransaction: true,
                    original: tx
                }
            })

            // 4. Merge
            let merged = [...normalizedReceivables, ...normalizedTransactions]

            // 5. Apply Status Filter
            if (filters.status) {
                // ... existing status logic
                if (filters.status === RECEIVABLE_STATUS.PAID) {
                    merged = merged.filter(i => i.status === RECEIVABLE_STATUS.PAID)
                } else if (filters.status === RECEIVABLE_STATUS.OPEN) {
                    merged = merged.filter(i => i.status === RECEIVABLE_STATUS.OPEN || i.status === RECEIVABLE_STATUS.OVERDUE)
                } else if (filters.status === RECEIVABLE_STATUS.OVERDUE) {
                    merged = merged.filter(i => i.status === RECEIVABLE_STATUS.OVERDUE)
                } else if (filters.status === RECEIVABLE_STATUS.CANCELED) {
                    merged = merged.filter(i => i.status === RECEIVABLE_STATUS.CANCELED)
                }
            }

            // 6. Sort by Due Date
            merged.sort((a, b) => {
                if (a.dueDate === b.dueDate) return 0
                return a.dueDate > b.dueDate ? 1 : -1
            })

            setReceivables(merged)
        } catch (error) {
            console.error("Failed to fetch receivables and transactions", error)
        } finally {
            setLoading(false)
        }
    }, [filters.startDate, filters.endDate, filters.status, allClients])

    // Auto-fetch disabled as per user request ("Buscar" button triggers fetch)
    // useEffect(() => {
    //    fetchData()
    // }, [fetchData])

    // Derived Data: Client Candidates for Autocomplete
    const clientCandidates = useMemo(() => {
        const q = (clientSearchText || "").trim().toLowerCase()
        if (!q) return []
        return allClients
            .filter(c => {
                const name = (c.name || "").toLowerCase()
                return name.includes(q)
            })
            .slice(0, 5) // Limit to 5 suggestions
    }, [allClients, clientSearchText])

    // Handle Client Selection
    const handleSelectClient = (client) => {
        setSelectedClient(client)
        setClientSearchText("") // Clear search text
        updateFilter("clientId", client.id)
    }

    const handleClearClient = () => {
        setSelectedClient(null)
        setClientSearchText("")
        updateFilter("clientId", null)
    }

    // Clear All Filters
    const clearFilters = () => {
        setFilters({
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
            status: "",
            search: "",
            clientId: null
        })
        setSelectedClient(null)
        setClientSearchText("")
    }

    // Derived Data: Filtered Receivables (Client Side Filters)
    const filteredData = useMemo(() => {
        return receivables.filter(item => {
            // Filter by Specific Client ID (if selected)
            if (filters.clientId && String(item.idClient) !== String(filters.clientId)) {
                return false
            }

            // Fallback Text Search (if no specific client selected, but search text exists)
            if (!filters.clientId && filters.search) {
                const term = filters.search.toLowerCase()
                const matchName = (item.clientName || "").toLowerCase().includes(term)
                const matchDesc = (item.description || "").toLowerCase().includes(term)
                return matchName || matchDesc
            }

            return true
        })
    }, [receivables, filters.clientId, filters.search])

    // Stats
    const stats = useMemo(() => {
        const dataToSum = filteredData

        const totalOpen = dataToSum
            .filter(i => (i.status === RECEIVABLE_STATUS.OPEN || i.status === RECEIVABLE_STATUS.OVERDUE))
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

        const totalOverdue = dataToSum
            .filter(i => i.status === RECEIVABLE_STATUS.OVERDUE)
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

        const totalPaid = dataToSum
            .filter(i => i.status === RECEIVABLE_STATUS.PAID)
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

        return {
            toReceive: totalOpen,
            overdue: totalOverdue,
            paid: totalPaid,
        }
    }, [filteredData])

    return {
        data: filteredData,
        loading,
        filters,
        updateFilter,
        stats,

        refresh: fetchData,
        clearFilters, // New
        // New Props for Client Search
        clientSearchText,
        setClientSearchText,
        clientCandidates,
        selectedClient,
        handleSelectClient,
        handleClearClient
    }
}
