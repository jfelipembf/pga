import { useState, useEffect, useMemo } from "react"
import { useToast } from "components/Common/ToastProvider"
import { useLoading } from "../../../../hooks/useLoading"
import {
    createActivityWithSchedule,
    useActivityPhotoUpload,
    updateActivity,
    reorderActivities, // NEW
    deleteActivity, // NEW
} from "../../../../services/Activity"
import { normalizeStatusPt } from "../Utils"
import { buildActivityPayload } from "services/payloads"
import { INITIAL_ACTIVITY_FORM } from "../Constants"
import { useActivitiesData } from "./useActivitiesData"

export const useActivitiesPage = ({ setBreadcrumbItems }) => {
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()

    // Data Hook handles fetching
    const { activities, setActivities } = useActivitiesData({ withLoading, toast })

    const [selectedId, setSelectedId] = useState(null)
    const selected = useMemo(() => activities.find(a => a.id === selectedId), [activities, selectedId])

    const [formValue, setFormValue] = useState(INITIAL_ACTIVITY_FORM)

    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState("")

    const { uploadPhoto, uploading: uploadingPhoto } = useActivityPhotoUpload()

    // Drag & Drop State
    const [dragging, setDragging] = useState(null) // { id }

    // Delete State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Atividades", link: "/admin/activity" },
        ]
        setBreadcrumbItems("Atividades", breadcrumbItems)
    }, [setBreadcrumbItems])

    useEffect(() => {
        if (selected) {
            const next = { ...selected, status: normalizeStatusPt(selected.status) }
            setFormValue(next)
            setPhotoFile(null)
            setPhotoPreview(next.photo || "")
        } else {
            setFormValue(INITIAL_ACTIVITY_FORM)
            setPhotoFile(null)
            setPhotoPreview("")
        }
    }, [selected])

    const handleSave = async () => {
        try {
            await withLoading("save", async () => {
                if (!formValue.name) {
                    toast.show({ title: "Informe o nome da atividade", color: "warning" })
                    return
                }

                // Strict photo (no fallback)
                let photo = formValue.photo || ""
                if (photoFile instanceof File) {
                    try {
                        photo = await uploadPhoto(photoFile)
                    } catch (err) {
                        console.error(err)
                        toast.show({ title: "Erro ao enviar foto", description: err?.message || String(err), color: "danger" })
                        return
                    }
                }

                const rawData = {
                    ...formValue,
                    photo: photo,
                    status: normalizeStatusPt(formValue.status)
                }

                // Strict payload builder
                const payload = buildActivityPayload(rawData)

                if (formValue.id === "new") {
                    const fullPayload = {
                        ...payload,
                        schedule: Array.isArray(formValue.schedule)
                            ? formValue.schedule.map(s => ({
                                weekday: s.weekday,
                                startTime: s.startTime || formValue.startTime || "",
                                endTime: s.endTime || formValue.endTime || "",
                                capacity: s.capacity || formValue.capacityDefault || 0,
                                idArea: s.idArea || formValue.idArea || "",
                                area: s.area || formValue.area || "",
                                idStaff: s.idStaff || formValue.idStaff || "",
                                instructor: s.instructor || formValue.instructor || "",
                            }))
                            : [],
                    }

                    const created = await createActivityWithSchedule(fullPayload)
                    const createdMapped = { ...created, status: normalizeStatusPt(created.status) }
                    setActivities(prev => [...prev, createdMapped])
                    setSelectedId(created.id)
                    setFormValue(createdMapped)
                    setPhotoFile(null)
                    setPhotoPreview("")
                    toast.show({ title: "Atividade criada", description: created.name, color: "success" })
                } else {
                    // Update
                    const updated = await updateActivity(formValue.id, payload)
                    const updatedMapped = { ...updated, status: normalizeStatusPt(updated.status) }
                    // Maintain local order if exists
                    setActivities(prev => prev.map(item => (item.id === formValue.id ? { ...item, ...updatedMapped, order: item.order } : item)))
                    setFormValue(prev => ({ ...prev, ...updatedMapped }))
                    setPhotoFile(null)
                    setPhotoPreview(updatedMapped.photo || "")
                    toast.show({ title: "Atividade atualizada", description: formValue.name, color: "success" })
                }
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro ao salvar", description: e?.message || String(e), color: "danger" })
        }
    }

    // --- DND Handlers ---
    const handleDragStart = (id) => {
        setDragging({ id })
    }

    const handleDragOver = (e, overId) => {
        if (!dragging || dragging.id === overId) return;

        setActivities((prev) => {
            const activeIndex = prev.findIndex((i) => i.id === dragging.id);
            const overIndex = prev.findIndex((i) => i.id === overId);

            if (activeIndex < 0 || overIndex < 0) return prev;

            const newItems = [...prev];
            const [movedItem] = newItems.splice(activeIndex, 1);
            newItems.splice(overIndex, 0, movedItem);

            return newItems;
        });
    }

    const handleDragEnd = async () => {
        setDragging(null)
        // Persist new order
        const orderedIds = activities.map(a => a.id)
        try {
            await reorderActivities(orderedIds)
            toast.show({ title: "Ordem salva", color: "success", size: "small" }) // Feedback enabled
        } catch (e) {
            console.error("Failed to reorder", e)
            toast.show({ title: "Erro ao salvar ordem", color: "danger" })
        }
    }

    // --- Actions Handlers ---
    const handleDeleteRequest = (id) => {
        setItemToDelete(id)
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return
        setShowDeleteConfirm(false)

        try {
            await withLoading("delete", async () => {
                await deleteActivity(itemToDelete)
                setActivities(prev => prev.filter(a => a.id !== itemToDelete))
                if (selectedId === itemToDelete) {
                    setSelectedId(null)
                    setFormValue(INITIAL_ACTIVITY_FORM)
                }
                toast.show({ title: "Atividade excluída", color: "success" })
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro ao excluir", description: e.message, color: "danger" })
        } finally {
            setItemToDelete(null)
        }
    }

    const handleEdit = (id) => {
        handleSelect(id)
    }

    // Define sideItems with draggable logic
    const sideItems = useMemo(() => activities.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.description,
        draggable: true, // ENABLE DND
        helper: `Cor: ${item.color}`,
    })), [activities])

    const handleSelect = async (id) => {
        if (id === selectedId) return
        await withLoading("selection", async () => {
            await new Promise(resolve => setTimeout(resolve, 500))
            setSelectedId(id)
        })
    }

    return {
        activities,
        selectedId,
        setSelectedId,
        handleSelect,
        formValue,
        setFormValue,
        photoFile,
        setPhotoFile,
        photoPreview,
        isLoading,
        uploadingPhoto,
        handleSave,
        sideItems,
        setActivities,
        // Exports for DND & Actions
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleEdit,
        handleDeleteRequest,
        // Delete State
        showDeleteConfirm,
        setShowDeleteConfirm,
        handleConfirmDelete
    }
}
