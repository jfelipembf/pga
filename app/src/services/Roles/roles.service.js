import { addDoc, deleteDoc, getDocs, setDoc } from "firebase/firestore"
import { makeCreatePayload } from "../_core/payload"
import { rolesCol, roleDoc, getContext, getDb } from "./roles.repository"

export const listRoles = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = rolesCol(db, ctx)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const createRole = async (role, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = rolesCol(db, ctx)

  const payload = makeCreatePayload({
    ...role,
    permissions: role.permissions || {},
  }, ctx)

  if (role.id) {
    const docRef = roleDoc(db, ctx, role.id)
    await setDoc(docRef, payload, { merge: true })
    return { id: role.id, ...payload }
  }

  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export const deleteRole = async (roleId, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = roleDoc(db, ctx, roleId)
  await deleteDoc(ref)
}

export const ensureDefaultRoles = async (defaultRoles, { ctxOverride = null } = {}) => {
  const existing = await listRoles({ ctxOverride })
  const existingIds = new Set(existing.map(r => r.id))

  const missing = defaultRoles.filter(role => !existingIds.has(role.id))
  if (missing.length > 0 || existing.length === 0) {
    for (const role of defaultRoles) {
      await createRole(role, { ctxOverride })
    }
    return listRoles({ ctxOverride })
  }

  return existing
}
