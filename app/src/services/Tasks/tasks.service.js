import { getDocs, orderBy, query, where } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { tasksCol, getContext, getDb } from "./tasks.repository"

/**
 * Cria uma nova tarefa com auditoria via Cloud Function.
 */
export const createTask = async (taskData) => {
    const fns = requireFunctions()
    const ctx = getContext()
    const createTaskFn = httpsCallable(fns, "createTask")

    const result = await createTaskFn({
        ...taskData,
        idTenant: ctx.idTenant,
        idBranch: ctx.idBranch
    })
    return result.data
}

/**
 * Lista tarefas pendentes de um staff específico.
 */
export const getStaffTasks = async (uid) => {
    const db = getDb()
    const ctx = getContext()
    const ref = tasksCol(db, ctx)

    // Buscamos tarefas onde o staff está na lista de designados
    // e o status é pendente.
    const q = query(
        ref,
        where("assignedStaffIds", "array-contains", uid),
        orderBy("dueDate", "asc")
    )

    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Marca uma tarefa como concluída com auditoria via Cloud Function.
 */
export const completeTask = async (taskId) => {
    const fns = requireFunctions()
    const ctx = getContext()
    const completeTaskFn = httpsCallable(fns, "completeTask")

    return await completeTaskFn({
        taskId,
        idTenant: ctx.idTenant,
        idBranch: ctx.idBranch
    })
}
