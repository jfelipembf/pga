import { useState, useEffect, useCallback } from "react"
import { EventService } from "../../../../services/Events/EventService"
import { useTenant } from "../../../../hooks/useTenant"
import { useAuth } from "../../../../hooks/useAuth"
import { toast } from "react-toastify"

export const useEvents = () => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { user: currentUser } = useAuth()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchEvents = useCallback(async () => {
        if (!isReady) return
        setLoading(true)
        try {
            // Buscamos todos os tipos de eventos (evaluation, test) concorrentemente para evitar flicker
            const [evaluations, tests] = await Promise.all([
                EventService.listEvents(idTenant, idBranch, 'evaluation'),
                EventService.listEvents(idTenant, idBranch, 'test')
            ]);

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
    }, [idTenant, idBranch, isReady])

    useEffect(() => {
        if (isReady) {
            fetchEvents()
        }
    }, [fetchEvents, isReady])

    const handleSave = async (userIgnored, eventData) => {
        // Use userIgnored as fallback if passed, but prefer currentUser from hook
        const userToUse = currentUser || userIgnored;

        if (!userToUse || !userToUse.uid) {
            toast.error("Usuário não identificado. Recarregue a página.")
            return false
        }

        setSaving(true)
        try {
            if (eventData.id) {
                const { id, ...dataToUpdate } = eventData
                await EventService.updateEvent(idTenant, idBranch, userToUse, id, dataToUpdate)
            } else {
                await EventService.createEvent(idTenant, idBranch, userToUse, eventData)
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

    const handleFinish = async (userIgnored, idEvent) => {
        const userToUse = currentUser || userIgnored;

        if (!userToUse || !userToUse.uid) {
            toast.error("Usuário não identificado.")
            return false
        }

        try {
            await EventService.finishEvent(idTenant, idBranch, userToUse, idEvent)
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
