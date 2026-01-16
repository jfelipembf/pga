import { useState, useMemo, useEffect } from "react"
import { useToast } from "../../../../components/Common/ToastProvider"
import { useLoading } from "../../../../hooks/useLoading"
import * as evaluationLevelsService from "../../../../services/EvaluationLevels"

export const useEvaluationLevelsLogic = () => {
    const [levels, setLevels] = useState([])
    const [selectedId, setSelectedId] = useState("")
    const [draggingId, setDraggingId] = useState(null)
    const [isCreating, setIsCreating] = useState(false)
    const [form, setForm] = useState({ title: "", value: 0 })

    const toast = useToast()
    const { isLoading, withLoading } = useLoading()

    const selected = useMemo(() => levels.find(l => l.id === selectedId) || null, [levels, selectedId])

    useEffect(() => {
        const loadLevels = async () => {
            try {
                await withLoading("page", async () => {
                    const levelsData = await evaluationLevelsService.listEvaluationLevels()
                    setLevels(levelsData)
                    if (levelsData.length > 0 && !selectedId) {
                        setSelectedId(levelsData[0].id)
                    }
                })
            } catch (error) {
                console.error("Erro ao carregar níveis:", error)
                toast.show({ title: "Erro", description: "Não foi possível carregar os níveis.", color: "danger" })
                setLevels([])
            }
        }
        loadLevels()
    }, [withLoading, toast, selectedId])

    useEffect(() => {
        if (selected) {
            setForm({ title: selected.title, value: selected.value })
        }
    }, [selected])

    const handleSelect = id => {
        setIsCreating(false)
        setSelectedId(id)
    }

    const onDragStart = id => setDraggingId(id)
    const onDragOver = (e, overId) => {
        e.preventDefault()
        if (!draggingId || draggingId === overId) return
        const currentIndex = levels.findIndex(l => l.id === draggingId)
        const overIndex = levels.findIndex(l => l.id === overId)
        const next = [...levels]
        const [moved] = next.splice(currentIndex, 1)
        next.splice(overIndex, 0, moved)
        setLevels(next)
    }
    const onDragEnd = () => setDraggingId(null)

    const handleNew = () => {
        setIsCreating(true)
        setSelectedId("")
        setForm({ title: "", value: levels.length > 0 ? Math.max(...levels.map(l => Number(l.value) || 0)) + 1 : 1 })
    }

    const handleSave = e => {
        e.preventDefault()
        if (!form.title) return

        const run = async () => {
            try {
                await withLoading("save", async () => {
                    const updatedData = {
                        title: form.title,
                        value: Number(form.value) || 0,
                    }

                    // Se estiver criando, força CREATE (sem sobrescrever)
                    const saveId = isCreating ? "" : selectedId
                    const result = await evaluationLevelsService.saveEvaluationLevel(saveId, updatedData)

                    setLevels(prev => {
                        const targetId = saveId || result.id
                        const exists = prev.find(item => item.id === targetId)
                        if (exists) {
                            return prev.map(item => item.id === targetId ? { ...item, ...updatedData } : item)
                        }
                        return [...prev, result].sort((a, b) => a.value - b.value)
                    })

                    // Se criou um novo, mantém modo "Novo" e limpa formulário para cadastrar outro
                    if (isCreating) {
                        setSelectedId("")
                        setIsCreating(true)
                        setForm(prev => ({
                            title: "",
                            value: (Number(updatedData.value) || 0) + 1,
                        }))
                    } else {
                        // Edição: permanece selecionado
                        setSelectedId(result.id)
                        setIsCreating(false)
                    }

                    toast.show({ title: "Sucesso", description: "Nível salvo com sucesso!", color: "success" })
                })
            } catch (err) {
                console.error("Erro ao salvar nível", err)
                toast.show({
                    title: "Erro ao salvar",
                    description: err?.message || "Ocorreu um erro inesperado. Verifique o console.",
                    color: "danger"
                })
            }
        }
        run()
    }

    const handleDelete = id => {
        const run = async () => {
            try {
                await withLoading("delete", async () => {
                    await evaluationLevelsService.deleteEvaluationLevel(id)
                    setLevels(prev => {
                        const remaining = prev.filter(l => String(l.id) !== String(id))

                        if (String(selectedId) === String(id)) {
                            const nextId = remaining[0]?.id || ""
                            setSelectedId(nextId)
                            setIsCreating(false)
                        }

                        return remaining
                    })

                    toast.show({ title: "Removido", description: "Nível excluído.", color: "success" })
                })
            } catch (err) {
                console.error("Erro ao excluir nível", err)
                toast.show({ title: "Erro", description: err?.message || "Falha ao excluir.", color: "danger" })
            }
        }
        run()
    }

    const sideMenuItems = useMemo(() => levels.map((lvl, index) => ({
        id: lvl.id,
        title: lvl.title,
        subtitle: `Valor: ${lvl.value}`,
        meta: `#${index + 1}`,
        helper: "Arraste para reordenar",
        draggable: true,
    })), [levels])

    return {
        levels,
        selectedId,
        selected,
        isCreating,
        form,
        setForm,
        isLoading,
        handleSelect,
        handleNew,
        handleSave,
        handleDelete,
        onDragStart,
        onDragOver,
        onDragEnd,
        sideMenuItems
    }
}
