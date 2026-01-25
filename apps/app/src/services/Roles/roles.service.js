import { addDoc, deleteDoc, getDocs, setDoc } from "firebase/firestore"
import { makeCreatePayload } from "../_core/payload"
import { mapFirestoreDocs } from "../_core/mappers"
import { rolesCol, roleDoc, getContext, getDb } from "./roles.repository"

export const listRoles = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = rolesCol(db, ctx)
  const snap = await getDocs(ref)
  return mapFirestoreDocs(snap)
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

  // 1. Create missing roles
  const missing = defaultRoles.filter(role => !existingIds.has(role.id))
  for (const role of missing) {
    await createRole(role, { ctxOverride })
  }

  // 2. Update existing default roles to ensure permissions are in sync (e.g. key migrations)
  // We only update roles that match IDs in defaultRoles list (system roles)
  const existingSystemRoles = defaultRoles.filter(role => existingIds.has(role.id))
  for (const role of existingSystemRoles) {
    // Force update permissions and labels for system roles
    await createRole(role, { ctxOverride })
    // createRole with an ID performs a setDoc with { merge: true }, so this updates permissions safely
  }

  return listRoles({ ctxOverride })
}
