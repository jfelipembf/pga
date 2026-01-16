import { useEffect, useMemo, useState } from "react"

import { listActiveClients } from "../../services/Clients"

const safeNameFrom = (obj = {}) => {
  const firstName = obj.firstName || obj.clientFirstName || obj.name || ""
  const lastName = obj.lastName || obj.clientLastName || ""
  const full = obj.fullName || obj.clientName || obj.name || `${firstName} ${lastName}`.trim()
  return (full || "").trim() || "Aluno sem nome"
}

export const useActiveClientsPool = ({ enabled = true } = {}) => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!enabled) {
        setClients([])
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await listActiveClients()
        const normalized = (Array.isArray(data) ? data : []).map(c => {
          const name = safeNameFrom({
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            fullName: c.fullName || c.name || "",
            name: c.name || "",
          })

          return {
            id: String(c.id || ""),
            tag: "CL",
            photo: c.avatar || c.photo || null,
            enrollmentId: null,
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            name,
            idGym: c.idGym || "--",
          }
        })

        if (!cancelled) setClients(normalized)
      } catch (e) {
        console.error("Erro ao carregar clientes ativos", e)
        if (!cancelled) {
          setError(e)
          setClients([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [enabled])

  const clientsById = useMemo(() => {
    const map = new Map()
    ;(clients || []).forEach(c => {
      if (c?.id == null) return
      map.set(String(c.id), c)
    })
    return map
  }, [clients])

  return { clients, clientsById, loading, error }
}

export default useActiveClientsPool
