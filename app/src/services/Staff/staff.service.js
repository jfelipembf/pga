import { useMemo } from "react"
import { getDocs, orderBy, query, setDoc, where } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { usePhotoUpload } from "../../hooks/usePhotoUpload"
import { makeCreatePayload } from "../_core/payload"
import { requireFunctions } from "../_core/functions"
import { staffCol, staffDoc, getContext, getDb } from "./staff.repository"
import { buildStaffPayload } from "../payloads"

export const listStaff = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = staffCol(db, ctx)
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const listInstructors = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = staffCol(db, ctx)
  // We assume there is an index for isInstructor, or it's small enough.
  // Ideally, use: where("isInstructor", "==", true)
  const snap = await getDocs(query(ref, where("isInstructor", "==", true), orderBy("name", "asc")))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createStaff = async (staff, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)

  // Update existing staff (Firestore direct update)
  if (staff.id) {
    const payload = makeCreatePayload({
      ...staff,
      status: staff.status || "active",
    }, ctx)
    const docRef = staffDoc(db, ctx, staff.id)
    await setDoc(docRef, payload, { merge: true })
    return { id: staff.id, ...payload }
  }

  // ...

  // Create new staff (Cloud Function)
  const functions = requireFunctions()
  const createStaffFn = httpsCallable(functions, "staffCriarUsuario")

  try {
    const payload = buildStaffPayload(staff)
    const params = {
      ...payload,
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,
    }

    const result = await createStaffFn(params)
    return { id: result.data.uid, ...staff }
  } catch (error) {
    console.error("Erro ao criar colaborador via função:", error)
    throw error
  }
}

export const getStaff = async (id, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const docRef = staffDoc(db, ctx, id)
  await getDocs(query(staffCol(db, ctx), where("id", "==", id))) // or getDoc(docRef) if ID is doc ID
  // Trying direct doc get first if ID is known to be doc ID (which it is for Auth UIDs)
  // Actually, staffDoc uses ID.
  const d = await import("firebase/firestore").then(m => m.getDoc(docRef))
  if (d.exists()) return { id: d.id, ...d.data() }
  return null
}

export const updateStaff = async (staff, { ctxOverride = null } = {}) => {
  const ctx = getContext(ctxOverride)
  const functions = requireFunctions()
  const updateStaffFn = httpsCallable(functions, "staffAtualizarUsuario")

  try {
    if (!staff.id) {
      throw new Error("ID do colaborador é obrigatório na chamada do serviço (Frontend)");
    }
    const params = {
      ...staff,
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,
    }

    await updateStaffFn(params)
    return staff
  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error)
    throw error
  }
}

export const useStaffPhotoUpload = () => {
  const { uploadPhoto, uploading, error } = usePhotoUpload({ entity: "staff" })

  const uploadStaffPhoto = useMemo(() => {
    return async (file, options = {}) => {
      const { filenamePrefix = "photo", ctxOverride } = options
      const res = await uploadPhoto(file, { filenamePrefix, ctxOverride })
      return res?.url || ""
    }
  }, [uploadPhoto])

  return { uploadPhoto: uploadStaffPhoto, uploading, error }
}
