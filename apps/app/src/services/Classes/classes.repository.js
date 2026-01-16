// src/services/classes/classes.repository.js

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"

const getContext = () => requireBranchContext()

const classesColRef = (db, idTenant, idBranch) =>
  collection(db, "tenants", idTenant, "branches", idBranch, "classes")

export const listClasses = async ({ idActivity = null } = {}) => {
  const db = requireDb()
  const { idTenant, idBranch } = getContext()

  const ref = classesColRef(db, idTenant, idBranch)
  const q = idActivity ? query(ref, where("idActivity", "==", idActivity)) : query(ref)

  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClassById = async idClass => {
  if (!idClass) return null
  const db = requireDb()
  const { idTenant, idBranch } = getContext()

  const ref = doc(classesColRef(db, idTenant, idBranch), idClass)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const newClassDocRef = () => {
  const db = requireDb()
  const { idTenant, idBranch } = getContext()
  return doc(classesColRef(db, idTenant, idBranch))
}

export const classDocRef = idClass => {
  const db = requireDb()
  const { idTenant, idBranch } = getContext()
  return doc(classesColRef(db, idTenant, idBranch), idClass)
}
