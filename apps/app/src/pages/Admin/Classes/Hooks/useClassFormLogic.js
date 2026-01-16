import { useState } from "react"
import { createClass, updateClass, deleteClass } from "../../../../services/Classes"
import { buildClassPayload } from "../../../../services/payloads"
import { createEmptyClassForm } from "../Constants"

export const useClassFormLogic = ({ toast, withLoading, reloadData }) => {
    const [formState, setFormState] = useState(createEmptyClassForm())
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleDeleteClick = () => {
        if (!formState.id) return
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        setShowDeleteConfirm(false)

        try {
            await withLoading("delete", async () => {
                await deleteClass(formState.id)
                toast.show({ title: "Turma excluída", color: "success" })
                setFormState(createEmptyClassForm())
                await reloadData()
            })
        } catch (e) {
            console.error(e)
            toast.show({
                title: "Não foi possível excluir",
                description: e.message,
                color: "danger",
                duration: 5000
            })
        }
    }

    const handleSave = async (values) => {
        if (values?.cancelEdit) {
            setFormState(createEmptyClassForm())
            return
        }

        try {
            await withLoading("save", async () => {
                const rawPayload = {
                    ...formState,
                    maxCapacity: Number(formState.maxCapacity || 0),
                    durationMinutes: Number(formState.durationMinutes || 0),
                }
                const payload = buildClassPayload(rawPayload)

                if (formState.id) {
                    // Update
                    await updateClass(formState.id, payload)
                    toast.show({ title: "Turma atualizada", color: "success" })
                } else {
                    // Create
                    const created = await createClass(payload)
                    const total = Array.isArray(created) ? created.length : 1
                    toast.show({ title: `Turma criada (${total})`, color: "success" })
                }

                setFormState(createEmptyClassForm())
                await reloadData()
            })
        } catch (e) {
            console.error(e)
            toast.show({
                title: "Erro ao salvar turma",
                description: e?.message || String(e),
                color: "danger",
            })
        }
    }

    return {
        formState,
        setFormState,
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleDeleteClick,
        handleConfirmDelete,
        handleSave,
    }
}
