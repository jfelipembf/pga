import { useState } from "react"
import { useTenant } from "../../../hooks/useTenant"
import { ClassService } from ".."
import { createEmptyClassForm } from "../constants"

export const useClassFormLogic = ({ toast, withLoading, reloadData }) => {
    const [formState, setFormState] = useState(createEmptyClassForm())
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const { idTenant, idBranch, user, isReady } = useTenant()

    const handleDeleteClick = () => {
        if (!formState.id) return
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        setShowDeleteConfirm(false)

        try {
            await withLoading("delete", async () => {
                // Usar effectiveDate como data de referência para excluir sessões futuras
                const fromDate = formState.effectiveDate || new Date().toISOString().split('T')[0]

                const result = await ClassService.deleteClass(
                    idTenant,
                    idBranch,
                    user,
                    formState.id,
                    fromDate
                )

                toast.success(
                    `Turma excluída com sucesso! ${result.deletedSessionsCount} sessões futuras foram removidas.`
                )
                setFormState(createEmptyClassForm())
                await reloadData()
            })
        } catch (e) {
            console.error(e)
            toast.error("Erro ao excluir: " + e.message)
        }
    }

    const handleSave = async (values) => {
        if (values?.cancelEdit) {
            setFormState(createEmptyClassForm())
            return
        }

        if (!isReady) {
            toast.error("Contexto de unidade não carregado.")
            return
        }

        try {
            await withLoading("save", async () => {
                if (formState.id) {
                    // Update existing Class
                    await ClassService.updateClass(idTenant, idBranch, user, formState.id, formState)
                    toast.success("Turma atualizada com sucesso!")
                } else {
                    // Create using new ClassService
                    const weekdays = Array.isArray(formState.weekdays) ? formState.weekdays : [Number(formState.weekday)]

                    await ClassService.createGrade(idTenant, idBranch, user, {
                        ...formState,
                        weekdays,
                        isActive: true
                    })

                    toast.success("Grade de aulas criada com sucesso!")
                }

                setFormState(createEmptyClassForm())
                await reloadData()
            })
        } catch (e) {
            console.error(e)
            toast.error(e?.message || "Erro ao salvar turma")
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
