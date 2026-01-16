// src/services/classes/sessions.repository.js

import { collection, getDocs, orderBy, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

const getContext = () => requireBranchContext()

const sessionsColRef = (db, idTenant, idBranch) =>
  collection(db, "tenants", idTenant, "branches", idBranch, "sessions")

export const updateSessionStatus = async (idSession, status) => {
  if (!idSession) throw new Error("idSession é obrigatório")
  const db = requireDb()
  const { idTenant, idBranch } = getContext()
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "sessions", idSession)
  
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  })
  return { id: idSession, status }
}

export const listSessions = async ({
  idClass = null,
  startDate = null, // "YYYY-MM-DD"
  endDate = null,   // "YYYY-MM-DD"
  limitCount = 200,
} = {}) => {
  const db = requireDb()
  const { idTenant, idBranch } = getContext()

  const ref = sessionsColRef(db, idTenant, idBranch)
  const constraints = [orderBy("sessionDate", "asc")]

  if (idClass) constraints.push(where("idClass", "==", idClass))
  if (startDate) constraints.push(where("sessionDate", ">=", startDate))
  if (endDate) constraints.push(where("sessionDate", "<=", endDate))

  // Obs: para limit, você pode adicionar depois (precisa importar limit)
  const q = query(ref, ...constraints)
  const snap = await getDocs(q)

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return limitCount > 0 ? items.slice(0, limitCount) : items
}
