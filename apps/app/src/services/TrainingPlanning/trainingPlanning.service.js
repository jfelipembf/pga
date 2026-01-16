import {
    addDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore"

import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { makeCreatePayload, makeUpdatePayload } from "../_core/payload"
import { trainingPlansCol, trainingPlanDoc } from "./trainingPlanning.repository"

const mapDoc = d => ({ id: d.id, ...d.data() })

/** ===========================
 * READ
 * =========================== */

/**
 * List training plans, optionally filtered by date.
 * storedDate format expected: "YYYY-MM-DD"
 */
export const listTrainingPlans = async (dateStr = null, { ctxOverride = null } = {}) => {
    const db = requireDb()
    const ctx = requireBranchContext(ctxOverride)

    const col = trainingPlansCol(db, ctx)
    let q = query(col, where("deleted", "==", false)) // Default filter

    if (dateStr) {
        q = query(q, where("dateString", "==", dateStr))
    }

    const snap = await getDocs(q)
    const docs = snap.docs.map(mapDoc)

    // Client-side sort if needed (though Firestore can do it if composite index exists)
    return docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
}

export const getTrainingPlan = async (idPlan, { ctxOverride = null } = {}) => {
    if (!idPlan) return null

    const db = requireDb()
    const ctx = requireBranchContext(ctxOverride)

    const ref = trainingPlanDoc(db, ctx, idPlan)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null

    const data = { id: snap.id, ...snap.data() }
    return data?.deleted ? null : data
}

/** ===========================
 * WRITE
 * =========================== */

export const createTrainingPlan = async (data = {}, { ctxOverride = null } = {}) => {
    const db = requireDb()
    const ctx = requireBranchContext(ctxOverride)

    const col = trainingPlansCol(db, ctx)

    // Ensure dateString is present for querying
    // data.date is expected to be a JS Date object from the UI, so we convert it or expect data.dateString
    if (!data.dateString && data.date) {
        try {
            data.dateString = data.date.toISOString().split('T')[0];
        } catch (e) {
            console.warn("Invalid date format in createTrainingPlan", data.date);
        }
    }

    // Prepare payload
    // We store 'items' (the workout sets) directly as an array of objects
    const payload = makeCreatePayload({
        description: data.description || "",
        totalDistance: data.totalDistance || 0,
        items: data.items || [],
        dateString: data.dateString, // "YYYY-MM-DD"
        date: data.date, // Timestamp usually handled by Firestore if passed as Date, but logic helper might strip it? 
        // Let's rely on standard object, usually Date object translates to Timestamp
        status: 'active',
        deleted: false,
        ...data // Allow other fields override if needed, but be careful
    }, ctx)

    const docRef = await addDoc(col, payload)
    return { id: docRef.id, ...payload }
}

export const updateTrainingPlan = async (idPlan, data = {}, { ctxOverride = null } = {}) => {
    if (!idPlan) throw new Error("ID do treino não informado")

    const db = requireDb()
    const ctx = requireBranchContext(ctxOverride)

    const ref = trainingPlanDoc(db, ctx, idPlan)

    const payload = makeUpdatePayload(
        data,
        { updatedAt: serverTimestamp() }
    )

    await updateDoc(ref, payload)
    return { id: idPlan, ...payload }
}

export const deleteTrainingPlan = async (idPlan, { ctxOverride = null, hard = false } = {}) => {
    if (!idPlan) throw new Error("ID do treino não informado")

    const db = requireDb()
    const ctx = requireBranchContext(ctxOverride)

    const ref = trainingPlanDoc(db, ctx, idPlan)

    if (hard) {
        await deleteDoc(ref)
        return true
    }

    await updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() })
    return true
}
