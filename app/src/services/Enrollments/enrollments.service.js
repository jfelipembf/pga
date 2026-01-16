import { getDoc, getDocs, query, where } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"
import { normalizeDate, parseFirestoreDate } from "../../helpers/date"
import { enrollmentsCol, clientDoc, getContext, getDb } from "./enrollments.repository"
import { logExperimentalScheduling, logExperimentalCancellation } from "../Funnel/index"
import { buildEnrollmentPayload } from "../payloads"

export const listEnrollmentsByClient = async (idClient, { ctxOverride = null } = {}) => {
  if (!idClient) return []
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = enrollmentsCol(db, ctx)
  const snap = await getDocs(query(ref, where("idClient", "==", idClient)))
  // Retorna ordenado para facilitar a visualização no histórico
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0
      const dateB = b.createdAt?.seconds || 0
      return dateB - dateA
    })
}

export const listEnrollmentsByClass = async (idClass, { sessionDate, ctxOverride = null } = {}) => {
  if (!idClass) return []
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = enrollmentsCol(db, ctx)
  // Filtra apenas matrículas ativas para o modal de presença e grade
  const snap = await getDocs(query(ref, where("idClass", "==", idClass), where("status", "==", "active")))

  // Buscar detalhes dos clientes para cada matrícula
  const enrollments = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  const normalizedSessionDate = sessionDate
    ? normalizeDate(parseFirestoreDate(sessionDate))
    : null

  // Se sessionDate for informado, considerar apenas matrículas efetivas nessa data
  const effectiveEnrollments = normalizedSessionDate
    ? enrollments.filter(e => {
      // Lógica para Experimental / Single Session
      if (e.type === 'experimental' || e.type === 'single-session') {
        const sessionDate = normalizeDate(parseFirestoreDate(e.sessionDate))
        if (!sessionDate || !normalizedSessionDate) return false
        if (sessionDate.getTime() !== normalizedSessionDate.getTime()) return false
        return true
      }

      // Lógica para Recorrente
      const start = normalizeDate(parseFirestoreDate(e.startDate))
      const end = normalizeDate(parseFirestoreDate(e.endDate))
      if (start && normalizedSessionDate < start) return false
      if (end && normalizedSessionDate > end) return false
      return true
    })
    : enrollments

  const enrichPromises = effectiveEnrollments.map(async (e) => {
    if (!e.idClient) return e
    const clientRef = clientDoc(db, ctx, e.idClient)
    const clientSnap = await getDoc(clientRef)
    const clientData = clientSnap.exists() ? clientSnap.data() : {}
    return {
      ...e,
      clientName: clientData.name || `${clientData.firstName || ""} ${clientData.lastName || ""}`.trim(),
      clientAvatar: clientData.avatar || null,
      clientGymId: clientData.idGym || null
    }
  })

  // Using Promise.all to fetch client details (optimization possible: batch fetch if strict N+1 worry, but fine for now)
  const enriched = await Promise.all(enrichPromises)

  return enriched
}

export const listEnrollments = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = enrollmentsCol(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Deleta matrícula. 
 * @param {string} idEnrollment 
 * @param {object} options - { ctxOverride, enrollmentData } -> enrollmentData usada para logar cancelamento se for experimental
 */
export const deleteEnrollment = async (idEnrollment, { ctxOverride = null, enrollmentData = null } = {}) => {
  if (!idEnrollment) return null

  const functions = requireFunctions()
  const ctx = getContext(ctxOverride)

  const deleteEnrollmentFn = httpsCallable(functions, "deleteEnrollment")

  try {
    const payload = {
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,
      idEnrollment,
    }


    const result = await deleteEnrollmentFn(payload)

    // [FUNNEL] Log Experimental Cancellation
    // Precisamos saber se era experimental. Se o chamador passou enrollmentData, usamos.
    if (enrollmentData?.type === 'experimental' && enrollmentData.idClient) {
      logExperimentalCancellation(enrollmentData.idClient, {
        classId: enrollmentData.idClass,
        sessionId: enrollmentData.idSession
      }).catch(err => console.warn('[Funnel] Failed to log cancellation:', err))
    }

    return result.data
  } catch (error) {
    console.error("Erro ao deletar matrícula via função:", error)
    throw error
  }
}

export const createRecurringEnrollment = async (data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const createRecurringEnrollmentFn = httpsCallable(functions, "createRecurringEnrollment")

  try {
    const payload = buildEnrollmentPayload(data)
    const result = await createRecurringEnrollmentFn({
      ...payload,
      idTenant,
      idBranch,
    })
    return result.data
  } catch (error) {
    console.error("Erro ao criar matrícula recorrente via função:", error)
    throw error
  }
}

export const createSingleSessionEnrollment = async (data) => {

  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const createSingleSessionEnrollmentFn = httpsCallable(functions, "createSingleSessionEnrollment")

  try {
    const payload = buildEnrollmentPayload(data)

    const result = await createSingleSessionEnrollmentFn({
      ...payload,
      idTenant,
      idBranch,
      clientPhone: data.clientPhone,
      sessionTime: data.startTime
    })

    // [FUNNEL] Log Experimental Scheduled
    if (result.data?.idEnrollment && data.type === 'experimental') {
      // data: { idClient, idClass, idSession, sessionDate, type, ... }
      logExperimentalScheduling(data.idClient, {
        classId: data.idClass,
        sessionId: data.idSession,
        date: data.sessionDate,
        instructorId: data.idStaff || null // If available in data
      }).catch(err => console.warn('[Funnel] Failed to log experimental scheduling:', err))
    }

    return result.data
  } catch (error) {
    console.error("Erro ao criar matrícula avulsa via função:", error)
    throw error
  }
}
