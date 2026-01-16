// src/services/classes/classes.service.js

import { requireBranchContext } from "../_core/context"
import { listClasses } from "./classes.repository"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { buildClassPayload } from "../payloads"

const getContext = () => requireBranchContext()

/**
 * Cria turmas.
 * Suporta:
 * - data.weekDays: [1,3,5] (cria 1 turma por weekday)
 * - data.schedule: [{ weekday, startTime, endTime, ... }] (cria 1 turma por item)
 *
 * Em ambos os casos, após criar a turma, gera sessões (occurrences) para as próximas N semanas.
 */
export const createClasses = async (data = {}, { weeks = 4 } = {}) => {
  const { idTenant, idBranch } = getContext()
  const functions = requireFunctions()

  const createClassFn = httpsCallable(functions, "createClass")
  /* const generateSessionsFn = httpsCallable(functions, "generateClassSessions") */ // Removing unused

  const created = []

  // 1) schedule (igual antigo "activity schedule", mas agora vira class + sessions)
  if (Array.isArray(data.schedule) && data.schedule.length) {
    const { schedule, ...rest } = data

    // ... 

    for (const item of schedule) {
      const classPayload = buildClassPayload({
        ...rest,
        weekday: item.weekday ?? null,
        startTime: item.startTime || rest.startTime || "",
        endTime: item.endTime || rest.endTime || "",
        durationMinutes: Number(item.durationMinutes || rest.durationMinutes || 0),
        maxCapacity: Number(item.maxCapacity || item.capacity || rest.maxCapacity || 0),
        idActivity: item.idActivity || rest.idActivity || null,
        idStaff: item.idStaff || rest.idStaff || null,
        idArea: item.idArea || rest.idArea || null,
      })


      const startT = Date.now();
      try {
        const result = await createClassFn({
          idTenant,
          idBranch,
          classData: classPayload,
        })

        const createdClass = result.data
        created.push(createdClass)
      } catch (err) {
        console.error(`[DEBUG] createClasses ERROR (${Date.now() - startT}ms)`, err);
        throw err;
      }
    }
    return created
  }

  // 2) weekDays (cria 1 turma por dia)
  const days =
    Array.isArray(data.weekDays) && data.weekDays.length > 0 ? data.weekDays : [data.weekday ?? null]

  for (const day of days) {
    const { weekDays, ...rest } = data
    const classPayload = { ...rest, weekday: day ?? null }


    const startT = Date.now();
    try {
      const result = await createClassFn({
        idTenant,
        idBranch,
        classData: classPayload,
      })

      const createdClass = result.data
      created.push(createdClass)
    } catch (err) {
      console.error(`[DEBUG] createClasses (weekDays) ERROR (${Date.now() - startT}ms)`, err);
      throw err;
    }
  }

  return created
}

export const updateClass = async (idClass, data) => {
  if (!idClass) throw new Error("idClass é obrigatório")

  const { idTenant, idBranch } = getContext()
  const functions = requireFunctions()

  const updateClassFn = httpsCallable(functions, "updateClass")

  const result = await updateClassFn({
    idTenant,
    idBranch,
    idClass,
    classData: data,
  })

  return result.data
}

export const deleteClass = async idClass => {
  if (!idClass) throw new Error("idClass é obrigatório")

  const { idTenant, idBranch } = getContext()
  const functions = requireFunctions()

  const deleteClassFn = httpsCallable(functions, "deleteClass")

  await deleteClassFn({
    idTenant,
    idBranch,
    idClass,
  })

  return true
}

export const listAllClasses = async () => listClasses()
