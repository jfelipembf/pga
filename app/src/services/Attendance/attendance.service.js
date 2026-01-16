import { getDoc } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"
import { sessionDoc, getContext, getDb } from "./attendance.repository"
import { logExperimentalAttendance } from "../Funnel/index"

/**
 * Registra a presença de um aluno em uma sessão específica.
 * Salva no histórico do cliente e também prepara para o snapshot da sessão.
 */
export const markAttendance = async ({
  idClient,
  idSession,
  idClass,
  sessionDate,
  status = "present",
  justification = "",
  type = null,
}) => {
  if (!idClient || !idSession) throw new Error("idClient e idSession são obrigatórios")

  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const markAttendanceFn = httpsCallable(functions, "markAttendance")

  try {
    const result = await markAttendanceFn({
      idTenant,
      idBranch,
      idClient,
      idSession,
      idClass,
      sessionDate,
      status,
      justification,
      type,
    })

    // [FUNNEL] Log Experimental Attended
    // We expect 'type' to be passed as 'experimental' from the UI when relevant,
    // or the backend handles it. But for the frontend log, we rely on the caller passing correct type.
    if (status === 'present' && type === 'experimental') {
      logExperimentalAttendance(idClient, {
        classId: idClass,
        sessionId: idSession,
        // instructorId might need to be fetched if not available, 
        // but for now we log what we have.
      }).catch(err => console.warn('[Funnel] Failed to log experimental attendance:', err))
    }

    return result.data
  } catch (error) {
    console.error("Erro ao registrar presença via função:", error)
    throw error
  }
}

/**
 * Salva o Snapshot de presença na Sessão.
 */
export const saveSessionSnapshot = async (idSession, {
  clients = [], // { idClient, name, status, justification }
  presentCount = 0,
  absentCount = 0
}) => {
  if (!idSession) throw new Error("idSession é obrigatório")

  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const saveSessionSnapshotFn = httpsCallable(functions, "saveSessionSnapshot")

  try {
    const result = await saveSessionSnapshotFn({
      idTenant,
      idBranch,
      idSession,
      clients,
      presentCount,
      absentCount,
    })
    return result.data
  } catch (error) {
    console.error("Erro ao salvar snapshot de presença via função:", error)
    throw error
  }
}

export const getSessionAttendanceSnapshot = async (idSession, { ctxOverride = null } = {}) => {
  if (!idSession) return null
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = sessionDoc(db, ctx, idSession)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export const addExtraParticipantToSession = async (idSession, participant) => {
  if (!idSession) throw new Error("idSession é obrigatório")
  if (!participant?.idClient) throw new Error("participant.idClient é obrigatório")

  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const addExtraParticipantFn = httpsCallable(functions, "addExtraParticipantToSession")

  try {
    const result = await addExtraParticipantFn({
      idTenant,
      idBranch,
      idSession,
      participant,
    })
    return result.data
  } catch (error) {
    console.error("Erro ao adicionar participante extra via função:", error)
    throw error
  }
}
