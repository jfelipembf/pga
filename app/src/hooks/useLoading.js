import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * Hook para centralizar estados de loading com "tags".
 *
 * Exemplo:
 * const { isLoading, withLoading } = useLoading()
 * await withLoading('page', async () => { ... })
 */
const normalizeKey = key => String(key || "")

export const useLoading = () => {
  const [loadingByKey, setLoadingByKey] = useState({})
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const setKey = useCallback((key, value) => {
    const k = normalizeKey(key)
    if (!k) return
    if (!mountedRef.current) return
    setLoadingByKey(prev => {
      const next = { ...prev, [k]: Boolean(value) }
      return next
    })
  }, [])

  const start = useCallback(key => setKey(key, true), [setKey])
  const stop = useCallback(key => setKey(key, false), [setKey])

  const isLoading = useCallback(
    key => {
      const k = normalizeKey(key)
      return Boolean(loadingByKey[k])
    },
    [loadingByKey]
  )

  const anyLoading = useMemo(() => Object.values(loadingByKey).some(Boolean), [loadingByKey])

  const withLoading = useCallback(
    async (key, fn) => {
      start(key)
      try {
        return await fn()
      } finally {
        stop(key)
      }
    },
    [start, stop]
  )

  const resetAll = useCallback(() => {
    if (!mountedRef.current) return
    setLoadingByKey({})
  }, [])

  return {
    loadingByKey,
    isLoading,
    anyLoading,
    start,
    stop,
    withLoading,
    resetAll,
  }
}
