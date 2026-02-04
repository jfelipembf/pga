import { useState, useCallback } from "react"

export const useLoading = () => {
  const [loadingStates, setLoadingStates] = useState({})

  const isLoading = useCallback((key) => {
    if (!key) return Object.values(loadingStates).some(Boolean)
    return Boolean(loadingStates[key])
  }, [loadingStates])

  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }))
  }, [])

  const withLoading = useCallback(async (key, asyncFn) => {
    try {
      setLoading(key, true)
      const result = await asyncFn()
      return result
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  return {
    isLoading,
    setLoading,
    withLoading,
    loadingStates
  }
}
