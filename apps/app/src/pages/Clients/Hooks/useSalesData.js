import { useState, useEffect } from "react"
import { listContracts } from "../../../services/Contracts"
import { listProducts, listServices } from "../../../services/Catalog/index"
import { useToast } from "../../../components/Common/ToastProvider"
import { useLoading } from "../../../hooks/useLoading"
import { itemsByTabDefaults } from "../Constants/salesDefaults"

export const useSalesData = () => {
    const [itemsByTab, setItemsByTab] = useState(itemsByTabDefaults)
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()

    useEffect(() => {
        const loadData = async () => {
            try {
                await withLoading('load', async () => {
                    const [contracts, products, services] = await Promise.all([
                        listContracts().then(list => list.filter(c => (c.status || "active") === "active")),
                        listProducts(),
                        listServices(),
                    ])
                    setItemsByTab({
                        contratos: contracts.map(c => ({
                            id: c.id,
                            label: c.title || c.nameMembership || "Contrato",
                            total: c.value || 0,
                            raw: c,
                        })),
                        produtos: products.map(p => ({
                            id: p.id,
                            label: p.name || p.title || "Produto",
                            total: p.price || 0,
                            raw: p,
                        })),
                        servicos: services.map(s => ({
                            id: s.id,
                            label: s.name || s.title || "Serviço",
                            total: s.price || 0,
                            raw: s,
                        })),
                    })
                })
            } catch (e) {
                console.error(e)
                toast.show({ title: "Erro ao carregar catálogo", description: e?.message || String(e), color: "danger" })
            }
        }
        loadData()
    }, [toast, withLoading])

    return {
        itemsByTab,
        isLoading: isLoading('load')
    }
}
