import React from "react"

import { listActivities } from "../../../../services/Activity"
import { listAreas } from "../../../../services/Areas/index"
import { listStaff } from "../../../../services/Staff/index"
import { listClasses, listSessions } from "../../../../services/Classes"

export const useClassesData = ({ withLoading, toast }) => {
  const [activities, setActivities] = React.useState([])
  const [areas, setAreas] = React.useState([])
  const [instructors, setInstructors] = React.useState([])
  const [classes, setClasses] = React.useState([])
  const [sessions, setSessions] = React.useState([])

  const loadAll = React.useCallback(async () => {
    await withLoading("page", async () => {
      const [acts, ars, staff, cls, sess] = await Promise.all([
        listActivities(),
        listAreas(),
        listStaff(),
        listClasses(),
        listSessions(),
      ])
      setActivities(acts || [])
      setAreas(ars || [])
      setInstructors(staff || [])
      setClasses(cls || [])
      setSessions(sess || [])
    })
  }, [withLoading])

  const reloadClassesAndSessions = React.useCallback(async () => {
    await withLoading("page", async () => {
      const [cls, sess] = await Promise.all([listClasses(), listSessions()])
      setClasses(cls || [])
      setSessions(sess || [])
    })
  }, [withLoading])

  React.useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        await loadAll()
      } catch (e) {
        console.error(e)
        if (mounted) {
          toast?.show?.({
            title: "Erro ao carregar dados",
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
  }, [loadAll, toast])

  return {
    activities,
    areas,
    instructors,
    classes,
    sessions,
    loadAll,
    reloadClassesAndSessions,
    setActivities,
    setAreas,
    setInstructors,
    setClasses,
    setSessions,
  }
}
