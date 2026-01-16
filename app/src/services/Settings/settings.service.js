import { getDoc, setDoc } from "firebase/firestore"
import { makeCreatePayload } from "../_core/payload"
import { settingsGeneralDoc, getContext, getDb } from "./settings.repository"

export const getSettings = async ({ ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const snap = await getDoc(settingsGeneralDoc(db, ctx))
  return snap.exists() ? snap.data() : null
}

export const saveSettings = async (data = {}, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = settingsGeneralDoc(db, ctx)

  const payload = makeCreatePayload(data, ctx)

  await setDoc(ref, payload, { merge: true })
  return payload
}


// This will be done after viewing staff.service.js
