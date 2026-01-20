import { getDocs, orderBy, query, where, collection, doc, getDoc } from "firebase/firestore"
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
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Resolve details for related users (Creator / Client)
    const staffCollection = collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "staff")
    const studentsCollection = collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "students") // Assuming 'students' collection

    const enrichedTasks = await Promise.all(tasks.map(async (task) => {
        let createdByData = {}
        let clientData = {}

        // Resolve Creator
        if (task.createdBy && typeof task.createdBy === 'string' && task.createdBy !== 'system') {
            try {
                // If createdBy is an ID, fetch staff details. 
                // However, we must be careful if 'createdBy' stores a name directly in legacy data.
                // Assuming it's an ID if it's alphanumeric and long, or we just try to fetch.
                const staffDoc = await getDoc(doc(staffCollection, task.createdBy))
                if (staffDoc.exists()) {
                    const data = staffDoc.data()
                    createdByData = {
                        createdByName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        createdByPhoto: data.photoUrl || data.photo || null
                    }
                } else {
                    // Fallback if ID not found or if it was just a name stored
                    createdByData = { createdByName: task.createdBy }
                }
            } catch (e) {
                createdByData = { createdByName: task.createdBy }
            }
        }

        // Resolve Client (if clientId exists)
        // Note: Currently task might store 'clientName' directly, but if we have an ID, let's prefer fetching latest data
        if (task.clientId) {
            try {
                const studentDoc = await getDoc(doc(studentsCollection, task.clientId))
                if (studentDoc.exists()) {
                    const data = studentDoc.data()
                    clientData = {
                        clientName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        clientPhoto: data.photoUrl || data.photo || null
                    }
                }
            } catch (e) {
                // Keep existing clientName if fetch fails
            }
        }

        return {
            ...task,
            ...createdByData,
            ...clientData
        }
    }))

    return enrichedTasks
}

/**
 * Marca uma tarefa como concluída com auditoria via Cloud Function.
 */
export const completeTask = async (taskId, observations) => {
    const fns = requireFunctions()
    const ctx = getContext()
    const completeTaskFn = httpsCallable(fns, "completeTask")

    return await completeTaskFn({
        taskId,
        idTenant: ctx.idTenant,
        idBranch: ctx.idBranch,
        observations // Opcional
    })
}

/**
 * Atualiza o status de uma tarefa (ex: in_progress, canceled).
 */
export const updateTaskStatus = async (taskId, status, observations) => {
    const fns = requireFunctions()
    const ctx = getContext()
    const fn = httpsCallable(fns, "updateTaskStatus")

    return await fn({
        taskId,
        status,
        observations,
        idTenant: ctx.idTenant,
        idBranch: ctx.idBranch
    })
}
