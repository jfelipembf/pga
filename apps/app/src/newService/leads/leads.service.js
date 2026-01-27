import {
    collection,
    addDoc,
    setDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit
} from "firebase/firestore"

// Adjust imports based on your project structure
// Assuming "../../services/_core" is the correct path from "apps/app/src/newService/leads"
import { requireDb } from "../../services/_core/db"
import { requireBranchContext } from "../../services/_core/context"
import { getNextSequence } from "../../services/_core/counters"


/* =========================================================================
   REFS
   ========================================================================= */

const getClientsCollection = (db, ctx) => {
    return collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients")
}

const getClientDoc = (db, ctx, idClient) => {
    return doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clients", idClient)
}

/* =========================================================================
   CRUD OPERATIONS
   ========================================================================= */

/**
 * List all leads (clients with status = 'lead' or generic listing if status not strictly enforced)
 * Uses direct Firestore access.
 */
export const listLeads = async ({ limitCount = 50, status = "lead" } = {}) => {
    const db = requireDb()
    const ctx = requireBranchContext()

    const colRef = getClientsCollection(db, ctx)

    // Construct query
    // If you strictly want only "leads", keep the where clause.
    // If "leads" implies all clients in this context, remove it.
    // For now, I'll allow filtering by status, defaulting to 'lead'.
    let q = query(
        colRef,
        where("deleted", "==", false),
        where("status", "==", status),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Get a single lead by ID
 */
export const getLead = async (idLead) => {
    if (!idLead) return null

    const db = requireDb()
    const ctx = requireBranchContext()

    const docRef = getClientDoc(db, ctx, idLead)
    const snap = await getDoc(docRef)

    if (!snap.exists()) return null

    const data = snap.data()
    if (data.deleted) return null

    return { id: snap.id, ...data }
}

/**
 * Create a new lead directly in Firestore with a SEQUENTIAL ID.
 * Shares the 'clients' counter sequence.
 */
export const createLead = async (data) => {
    const db = requireDb()
    const ctx = requireBranchContext()

    // Generate sequential ID (shared with clients)
    // You can adjust startAt if you need to start from a higher number (e.g. 1000)
    const seqValue = await getNextSequence("clients", { startAt: 1 })
    const newId = String(seqValue)

    // Clean undefined values if necessary
    const sanitizedData = JSON.parse(JSON.stringify(data))

    const payload = {
        ...sanitizedData,
        id: newId, // Store ID in the document as well for consistency
        status: sanitizedData.status || "lead",
        idTenant: ctx.idTenant,
        idBranch: ctx.idBranch,
        deleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }

    const docRef = getClientDoc(db, ctx, newId)
    await setDoc(docRef, payload)

    return { id: newId, ...payload }
}

/**
 * Update an existing lead directly
 */
export const updateLead = async (idLead, data) => {
    if (!idLead) throw new Error("Lead ID is required")

    const db = requireDb()
    const ctx = requireBranchContext()

    const docRef = getClientDoc(db, ctx, idLead)

    // Sanitize
    const sanitizedData = JSON.parse(JSON.stringify(data))
    delete sanitizedData.id // Prevent updating immutable ID if passed
    delete sanitizedData.createdAt

    const payload = {
        ...sanitizedData,
        updatedAt: serverTimestamp(),
    }

    await updateDoc(docRef, payload)

    return { id: idLead, ...payload }
}

/**
 * Soft delete a lead
 */
export const deleteLead = async (idLead) => {
    if (!idLead) throw new Error("Lead ID is required")

    const db = requireDb()
    const ctx = requireBranchContext()

    const docRef = getClientDoc(db, ctx, idLead)

    await updateDoc(docRef, {
        deleted: true,
        updatedAt: serverTimestamp(),
        status: "deleted"
    })

    return true
}
