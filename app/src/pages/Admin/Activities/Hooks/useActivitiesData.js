import { useState, useCallback, useEffect } from "react"
import { listActivitiesWithObjectives } from "../../../../services/Activity"
import { normalizeStatusPt } from "../Utils"

export const useActivitiesData = ({ withLoading, toast }) => {
  const [activities, setActivities] = useState([])

  const loadActivities = useCallback(async () => {
    await withLoading("page", async () => {
      const data = await listActivitiesWithObjectives()
      const mapped = data.map(item => ({ ...item, status: normalizeStatusPt(item.status) }))
      setActivities(mapped || [])
    })
  }, [withLoading])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        await loadActivities()
      } catch (e) {
        console.error(e)
        if (mounted) {
          toast?.show?.({
            title: "Erro ao carregar atividades",
            description: e?.message || String(e),
            color: "danger",
          })
        }
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [loadActivities, toast])

  return {
    activities,
    setActivities,
    loadActivities
  }
}
