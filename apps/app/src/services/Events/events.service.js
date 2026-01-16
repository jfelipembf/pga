import { getDocs } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { usePhotoUpload } from "../../hooks/usePhotoUpload"
import { eventsCol, getContext, getDb } from "./events.repository"
import { buildEventPayload } from "../payloads"

export const listEvents = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const snap = await getDocs(eventsCol(db, ctx))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createEvent = async (data, id) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const createEventFn = httpsCallable(functions, "createEvent")

  try {
    const result = await createEventFn({
      idTenant,
      idBranch,
      eventData: buildEventPayload(data),
      id: id || null,
    })
    return result.data
  } catch (error) {
    console.error("Erro ao criar evento via função:", error)
    throw error
  }
}

export const updateEvent = async (id, data) => {
  if (!id) throw new Error("id do evento é obrigatório")

  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const updateEventFn = httpsCallable(functions, "updateEvent")

  try {
    const result = await updateEventFn({
      idTenant,
      idBranch,
      id,
      eventData: data,
    })
    return result.data
  } catch (error) {
    console.error("Erro ao atualizar evento via função:", error)
    throw error
  }
}

export const deleteEvent = async id => {
  if (!id) throw new Error("id do evento é obrigatório")

  const functions = requireFunctions()
  const { idTenant, idBranch } = getContext()

  const deleteEventFn = httpsCallable(functions, "deleteEvent")

  try {
    await deleteEventFn({
      idTenant,
      idBranch,
      id,
    })
    return true
  } catch (error) {
    console.error("Erro ao deletar evento via função:", error)
    throw error
  }
}

export const getActiveEvent = async (type = 'avaliacao') => {
  const events = await listEvents()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  return events.find(ev => {
    if (ev.type !== type) return false
    if (!ev.startDate || !ev.endDate) return false
    return ev.startDate <= today && ev.endDate >= today
  }) || null
}

export const getActiveEvaluationEvent = async () => getActiveEvent('avaliacao')
export const getActiveTestEvent = async () => {
  const events = await listEvents()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  return events.find(ev => {
    if (ev.type !== 'testes' && ev.type !== 'teste') return false
    if (!ev.startDate || !ev.endDate) return false
    return ev.startDate <= today && ev.endDate >= today
  }) || null
}

// Hook para upload de anexos de eventos usando o padrão unificado
export const useEventAttachmentUpload = () => {
  return usePhotoUpload({ entity: "events" })
}
