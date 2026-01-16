export const sortClassesByCreated = classes =>
  (classes || []).slice().sort((a, b) => {
    const ta = a?.createdAt?.seconds || 0
    const tb = b?.createdAt?.seconds || 0
    if (ta !== tb) return ta - tb
    const taNanos = a?.createdAt?.nanoseconds || 0
    const tbNanos = b?.createdAt?.nanoseconds || 0
    if (taNanos !== tbNanos) return taNanos - tbNanos
    const na = (a?.name || "").toLowerCase()
    const nb = (b?.name || "").toLowerCase()
    if (na && nb && na !== nb) return na.localeCompare(nb)
    const ia = a?.id || ""
    const ib = b?.id || ""
    return ia.localeCompare(ib)
  })

export const buildClassOrderMap = classes => {
  const map = new Map()
  ;(classes || []).forEach((c, idx) => map.set(c.id, idx))
  return map
}

export const sortSessionsWithClassOrder = (sessions, classOrderMap = new Map()) =>
  (sessions || []).slice().sort((a, b) => {
    const sa = a.startTime || ""
    const sb = b.startTime || ""
    if (sa !== sb) return sa.localeCompare(sb)

    const oa = classOrderMap.get(a.idClass || a.idActivity) ?? Number.MAX_SAFE_INTEGER
    const ob = classOrderMap.get(b.idClass || b.idActivity) ?? Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob

    const da = a.sessionDate || ""
    const db = b.sessionDate || ""
    if (da && db && da !== db) return da < db ? -1 : 1

    const ca = a?.createdAt?.seconds || 0
    const cb = b?.createdAt?.seconds || 0
    if (ca !== cb) return ca - cb
    const can = a?.createdAt?.nanoseconds || 0
    const cbn = b?.createdAt?.nanoseconds || 0
    if (can !== cbn) return can - cbn
    const ida = a?.idSession || a?.id || ""
    const idb = b?.idSession || b?.id || ""
    return ida.localeCompare(idb)
  })
