import { useEffect, useMemo, useState } from "react"

import { listEnrollmentsByClass } from "../../services/Enrollments/enrollments.service"
import { listClientsByIds } from "../../services/Clients"

const safeNameFrom = (obj = {}) => {
  const firstName = obj.firstName || obj.clientFirstName || obj.name || ""
  const lastName = obj.lastName || obj.clientLastName || ""
  const full = obj.fullName || obj.clientName || obj.name || `${firstName} ${lastName}`.trim()
  return (full || "").trim() || "Aluno sem nome"
}

export const useClassClients = ({ classId, withLoading } = {}) => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!classId) {
        setClients([])
        return
      }

      const run = async () => {
        setLoading(true)
        setError(null)

        const enrollments = await listEnrollmentsByClass(classId)
        const safeEnrollments = Array.isArray(enrollments) ? enrollments : []
        const clientIds = [...new Set(safeEnrollments.map(e => e.idClient).filter(Boolean).map(String))]

        const clientDocs = await listClientsByIds(clientIds)
        const clientsMap = new Map((Array.isArray(clientDocs) ? clientDocs : []).map(c => [String(c.id), c]))

        const rows = safeEnrollments.map(e => {
          const c = clientsMap.get(String(e.idClient)) || {}
          const firstName = e.firstName || e.clientFirstName || c.firstName || ""
          const lastName = e.lastName || e.clientLastName || c.lastName || ""
          const name = safeNameFrom({
            name: e.name || e.clientName || c.name,
            firstName,
            lastName,
            fullName: e.fullName || c.fullName,
          })

          return {
            id: String(e.idClient || ""),
            tag: "CL",
            photo: e.photo || e.avatar || e.clientPhoto || c.avatar || c.photo || null,
            enrollmentId: e.idEnrollment || e.id,
            firstName,
            lastName,
            name,
            idGym: c.idGym || e.idGym || "--",
          }
        })

        if (!cancelled) setClients(rows)
      }

      try {
        if (withLoading) {
          await withLoading("clients", run)
        } else {
          await run()
        }
      } catch (e) {
        console.error("Erro ao carregar alunos", e)
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
  }, [classId, withLoading])

  const clientsById = useMemo(() => {
    const map = new Map()
      ; (clients || []).forEach(c => {
        if (c?.id == null) return
        map.set(String(c.id), c)
      })
    return map
  }, [clients])

  return { clients, clientsById, loading, error }
}

export default useClassClients
