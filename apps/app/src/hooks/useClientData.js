import { useEffect, useState, useCallback } from "react"
import { getClientAggregated } from "../services/Clients/index"

// Hook centralizado para carregar dados completos do cliente
export const useClientData = clientId => {
  const [data, setData] = useState({
    client: null,
    contracts: [],
    enrollments: [],
    financial: [],
    evaluations: [],
    tests: [],
    presences: [],
    attendanceMonthly: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(
    async id => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const result = await getClientAggregated(id)
        setData(result)
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    load(clientId)
  }, [clientId, load])

  return { ...data, loading, error, refetch: () => load(clientId) }
}

export default useClientData
