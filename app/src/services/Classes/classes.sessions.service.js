// src/services/classes/classes.sessions.service.js

import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"
import { httpsCallable } from "firebase/functions"


/**
 * IMPORTANTE:
 * - Para não sobrescrever sessões existentes, chame sempre com `fromDate`
 *   após a última sessão gerada (ex: lastDate + 1 dia).
 */
export const generateClassSessions = async ({
  idClass,
  classData,
  weeks = 4,
  fromDate = null,
} = {}) => {
  if (!idClass || !classData) return []

  const functions = requireFunctions()
  if (!functions) throw new Error("Firebase Functions não inicializado")

  const ctx = requireBranchContext()
  const generateSessionsFn = httpsCallable(functions, "generateClassSessions")

  try {
    const result = await generateSessionsFn({
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,
      idClass,
      classData,
      weeks,
      fromDate,
    })
    return result.data || []
  } catch (error) {
    console.error("Erro ao gerar sessões via função:", error)
    throw error
  }
}

/**
 * Gera sessões para várias turmas.
 * latestByClass: { [idClass]: "YYYY-MM-DD" } => ponto de partida por turma.
 */
export const generateSessionsForAllClasses = async ({
  classes = [],
  weeks = 4,
  fromDate = null,
  latestByClass = {},
} = {}) => {
  const results = []
  for (const cls of classes) {
    if (!cls?.id) continue

    const preferredStart = latestByClass[cls.id] || fromDate || cls.startDate || null
    const res = await generateClassSessions({
      idClass: cls.id,
      classData: cls,
      weeks,
      fromDate: preferredStart,
    })
    results.push(...res)
  }
  return results
}

