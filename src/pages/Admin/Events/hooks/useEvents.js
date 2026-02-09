import { useState, useEffect, useCallback } from "react"
import { EventService } from "../../../../services/Events/EventService"
import { useTenant } from "../../../../hooks/useTenant"
import { toast } from "react-toastify"

export const useEvents = () => {
    const { idTenant, idBranch } = useTenant()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const fetchEvents = useCallback(async () => {
        if (!idTenant || !idBranch) return
        setLoading(true)
        try {
            // Buscamos todos os tipos de eventos (evaluation, test)
            const evaluations = await EventService.listEvents(idTenant, idBranch, 'evaluation')
            const tests = await EventService.listEvents(idTenant, idBranch, 'test')

            const allEvents = [...evaluations, ...tests].sort((a, b) =>
                new Date(b.startDate) - new Date(a.startDate)
            )

            setEvents(allEvents)
        } catch (error) {
            console.error("Erro ao buscar eventos:", error)
            toast.error("Erro ao carregar ciclos")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    const handleSave = async (user, eventData) => {
        setSaving(true)
        try {
            if (eventData.id) {
                const { id, ...dataToUpdate } = eventData
                await EventService.updateEvent(idTenant, idBranch, user, id, dataToUpdate)
            } else {
                await EventService.createEvent(idTenant, idBranch, user, eventData)
            }
            toast.success("Ciclo salvo com sucesso!")
            await fetchEvents()
            return true
        } catch (error) {
            console.error("Erro ao salvar evento:", error)
            toast.error(error.message || "Erro ao salvar ciclo")
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleFinish = async (user, idEvent) => {
        try {
            await EventService.finishEvent(idTenant, idBranch, user, idEvent)
            toast.success("Ciclo finalizado!")
            await fetchEvents()
            return true
        } catch (error) {
            console.error("Erro ao finalizar evento:", error)
            toast.error("Erro ao finalizar")
            return false
        }
    }

    return {
        events,
        loading,
        saving,
        refresh: fetchEvents,
        handleSave,
        handleFinish
    }
}
