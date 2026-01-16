import { useState, useEffect, useMemo } from "react"
import { listEvents, createEvent, updateEvent, deleteEvent, useEventAttachmentUpload } from "../../../services/Events"
import { usePhotoUpload } from "../../../hooks/usePhotoUpload"
import { buildEventPayload } from "../../../services/payloads"
import { useToast } from "../../../components/Common/ToastProvider"
import { useLoading } from "../../../hooks/useLoading"
import { INITIAL_FORM_STATE, PLANNING_TABS, TEST_TYPES } from "../Constants/planningDefaults"

export const usePlanningEvents = () => {
    const [activeEventId, setActiveEventId] = useState("")
    const [tab, setTab] = useState(PLANNING_TABS.AVALIACAO)
    const [testType, setTestType] = useState(TEST_TYPES.TEMPO)
    const [form, setForm] = useState(INITIAL_FORM_STATE)
    const [events, setEvents] = useState([])
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [eventIdToDelete, setEventIdToDelete] = useState(null)

    const toast = useToast()
    const { uploadFile, uploading: uploadingAttachment } = useEventAttachmentUpload()
    const { uploadPhoto, uploading: uploadingPhoto } = usePhotoUpload({ entity: "events" })
    const { isLoading, withLoading } = useLoading()

    const uploading = uploadingAttachment || uploadingPhoto

    useEffect(() => {
        const load = async () => {
            try {
                await withLoading('page', async () => {
                    const list = await listEvents()
                    setEvents(list || [])
                    if (list?.length > 0) {
                        setActiveEventId(list[0].id)
                    } else {
                        setActiveEventId("")
                    }
                })
            } catch (e) {
                console.error("Erro ao carregar eventos", e)
                toast.show({ title: "Erro ao carregar eventos", description: e?.message || String(e), color: "danger" })
            }
        }
        load()
    }, [toast, withLoading]) // Added withLoading dependency

    const activeEvent = useMemo(
        () => events.find(ev => ev.id === activeEventId) || null,
        [activeEventId, events]
    )

    useEffect(() => {
        if (!activeEvent) {
            setForm(INITIAL_FORM_STATE)
            setTab(PLANNING_TABS.AVALIACAO)
            setTestType(TEST_TYPES.TEMPO)
            return
        }

        let currentTab = PLANNING_TABS.AVALIACAO
        if (activeEvent.type === "teste") currentTab = PLANNING_TABS.TESTES
        else if (activeEvent.type === "outro") currentTab = PLANNING_TABS.OUTRO

        setTab(currentTab)
        setForm({
            name: activeEvent.title || "",
            description: activeEvent.description || "",
            startDate: activeEvent.startDate || "",
            endDate: activeEvent.endDate || "",
            distance: activeEvent.distanceMeters || "",
            time: activeEvent.targetTime || "",
            styles: activeEvent.styles || "",
            attachment: null,
            photo: activeEvent.photo || "",
            photoFile: null,
        })
        setTestType(activeEvent.testType || TEST_TYPES.TEMPO)
    }, [activeEvent])

    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    const handleNew = () => {
        setActiveEventId("new")
        setTab(PLANNING_TABS.AVALIACAO)
        setTestType(TEST_TYPES.TEMPO)
        setForm(INITIAL_FORM_STATE)
    }

    const handleSave = async () => {
        try {
            await withLoading('save', async () => {
                let attachmentUrl = activeEvent?.attachmentUrl || null
                if (form.attachment) {
                    const res = await uploadFile(form.attachment)
                    attachmentUrl = res.url
                }

                let photo = form.photo || ""
                if (form.photoFile) {
                    const res = await uploadPhoto(form.photoFile)
                    photo = res.url
                }

                const rawData = {
                    title: form.name,
                    description: form.description,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    type: tab === PLANNING_TABS.TESTES ? "teste" : tab === PLANNING_TABS.OUTRO ? "outro" : "avaliacao",
                    testType: tab === PLANNING_TABS.TESTES ? testType : null,
                    distanceMeters: tab === PLANNING_TABS.TESTES && testType === TEST_TYPES.TEMPO ? Number(form.distance || 0) : null,
                    targetTime: tab === PLANNING_TABS.TESTES && testType === TEST_TYPES.DISTANCIA ? form.time || "" : null,
                    styles: tab === PLANNING_TABS.TESTES ? form.styles || "" : null,
                    attachmentUrl,
                    status: activeEvent?.status || "planejado",
                    photo: photo
                }

                const payload = buildEventPayload(rawData)

                if (activeEventId && activeEventId !== "new") {
                    await updateEvent(activeEventId, payload)
                    const updatedMapped = { ...payload, id: activeEventId }
                    setEvents(prev => prev.map(ev => (ev.id === activeEventId ? { ...ev, ...updatedMapped } : ev)))
                    toast.show({ title: "Evento atualizado", color: "success" })
                } else {
                    const created = await createEvent(payload)
                    setEvents(prev => [{ ...payload, id: created.id }, ...prev])
                    setActiveEventId(created.id)
                    toast.show({ title: "Evento criado", color: "success" })
                }
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro ao salvar", description: e?.message || String(e), color: "danger" })
        }
    }

    const handleDelete = (id) => {
        if (!id) return
        setEventIdToDelete(id)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!eventIdToDelete) return
        try {
            await withLoading('delete', async () => {
                await deleteEvent(eventIdToDelete)
                setEvents(prev => prev.filter(ev => ev.id !== eventIdToDelete))
                setActiveEventId(prev => (prev === eventIdToDelete ? events[0]?.id || "" : prev))
                toast.show({ title: "Evento removido", color: "success" })
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro ao remover", description: e?.message || String(e), color: "danger" })
        } finally {
            setIsDeleteModalOpen(false)
            setEventIdToDelete(null)
        }
    }

    const cancelDelete = () => {
        setIsDeleteModalOpen(false)
        setEventIdToDelete(null)
    }

    return {
        activeEventId,
        setActiveEventId,
        tab,
        setTab,
        testType,
        setTestType,
        form,
        setForm,
        updateField,
        events,
        activeEvent,
        isDeleteModalOpen,
        handleNew,
        handleSave,
        handleDelete,
        confirmDelete,
        cancelDelete,
        isLoading,
        uploading
    }
}
