import { useState, useMemo, useEffect } from "react"
import { useLoading } from "../../../../hooks/useLoading"
import { useToast } from "../../../../components/Common/ToastProvider"
import { createBlankAcquirer } from "../Constants/acquirersDefaults"
import { formatPercent } from "../Utils/acquirersUtils"
import { listAcquirers, saveAcquirer, deleteAcquirer } from "../../../../services/Acquirers"

export const useAcquirersLogic = () => {
    const [acquirers, setAcquirers] = useState([])
    const [selectedId, setSelectedId] = useState(null)
    const [formState, setFormState] = useState(createBlankAcquirer())
    const [initialized, setInitialized] = useState(false)
    const { isLoading, withLoading } = useLoading()
    const toast = useToast()

    useEffect(() => {
        const init = async () => {
            await withLoading('page', async () => {
                try {
                    const data = await listAcquirers()
                    setAcquirers(data)
                    if (data.length > 0) {
                        setSelectedId(data[0].id)
                        setFormState(data[0])
                    }
                    setInitialized(true)
                } catch (error) {
                    console.error("Erro ao carregar adquirentes:", error)
                    toast.show({ title: "Erro ao carregar adquirentes", color: "danger" })
                    setInitialized(true)
                }
            })
        }
        init()
    }, [withLoading, toast])

    const selectedAcquirer = useMemo(
        () => acquirers.find(item => item.id === selectedId),
        [acquirers, selectedId]
    )

    useEffect(() => {
        if (selectedAcquirer) {
            setFormState(selectedAcquirer)
        }
    }, [selectedAcquirer])

    const handleSelect = id => {
        setSelectedId(id)
    }

    const handleNew = () => {
        const draft = createBlankAcquirer()
        setSelectedId(draft.id)
        setFormState(draft)
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir esta adquirente?")) return

        try {
            await withLoading('delete', async () => {
                await deleteAcquirer(id)

                setAcquirers(prev => {
                    const updated = prev.filter(item => item.id !== id)
                    if (selectedId === id) {
                        setSelectedId(updated[0]?.id || null)
                        setFormState(updated[0] || createBlankAcquirer())
                    }
                    return updated
                })

                toast.show({ title: "Adquirente excluída", color: "success" })
            })
        } catch (error) {
            console.error("Erro ao excluir adquirente:", error)
            toast.show({ title: "Erro ao excluir adquirente", color: "danger" })
        }
    }

    const toggleBrand = id => {
        setFormState(prev => {
            const brands = new Set(prev.brands || [])
            if (brands.has(id)) {
                brands.delete(id)
            } else {
                brands.add(id)
            }
            return { ...prev, brands: Array.from(brands) }
        })
    }

    const toggleAnticipate = () => {
        setFormState(prev => ({ ...prev, anticipateReceivables: !prev.anticipateReceivables }))
    }

    const toggleActive = () => {
        setFormState(prev => ({ ...prev, inactive: !prev.inactive }))
    }

    const handleInstallmentChange = (index, field, raw) => {
        const value = field === "installments" ? Number(raw) : Number(raw)
        setFormState(prev => {
            const updated = [...prev.installmentFees]
            updated[index] = { ...updated[index], [field]: Number.isFinite(value) ? value : 0 }
            return { ...prev, installmentFees: updated }
        })
    }

    const handleAddInstallment = () => {
        setFormState(prev => ({
            ...prev,
            installmentFees: [...(prev.installmentFees || []), { installments: 1, feePercent: 0 }],
        }))
    }

    const handleRemoveInstallment = index => {
        setFormState(prev => ({
            ...prev,
            installmentFees: prev.installmentFees.filter((_, idx) => idx !== index),
        }))
    }

    const handleClear = () => {
        setFormState(createBlankAcquirer())
        setSelectedId(null)
    }

    const handleSave = async () => {
        if (!formState?.name) {
            toast.show({ title: "Nome é obrigatório", color: "warning" })
            return
        }

        try {
            await withLoading('save', async () => {
                const saved = await saveAcquirer(formState)

                setAcquirers(prev => {
                    const exists = prev.find(item => item.id === formState.id)
                    if (exists) {
                        return prev.map(item => (item.id === formState.id ? saved : item))
                    }
                    return [saved, ...prev]
                })

                setSelectedId(saved.id)
                setFormState(saved)

                toast.show({ title: "Adquirente salva", color: "success" })
            })
        } catch (e) {
            console.error("Erro ao salvar adquirente", e)
            toast.show({ title: "Erro ao salvar adquirente", color: "danger" })
        }
    }

    const sideMenuItems = useMemo(
        () =>
            acquirers.map(item => ({
                id: item.id,
                title: item.name || "Sem nome",
                subtitle: item.inactive ? "Inativo" : "Ativo",
                meta: formatPercent(item.creditOneShotFeePercent || 0),
            })),
        [acquirers]
    )

    return {
        isLoading,
        initialized,
        formState,
        setFormState,
        selectedId,
        handleSelect,
        handleDelete,
        handleNew,
        sideMenuItems,
        toggleActive,
        toggleBrand,
        toggleAnticipate,
        handleInstallmentChange,
        handleAddInstallment,
        handleRemoveInstallment,
        handleClear,
        handleSave
    }
}
