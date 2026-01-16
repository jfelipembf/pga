import { useState, useEffect, useRef } from "react"
import { listSessions, listClasses } from "../../../services/Classes"
import { listActivities } from "../../../services/Activity"
import { listAreas } from "../../../services/Areas/index"
import { listStaff } from "../../../services/Staff/index"
import { useLoading } from "../../../hooks/useLoading"

export const useEvaluationData = () => {
    const [sessions, setSessions] = useState([])
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const [classes, setClasses] = useState([])
    const { isLoading, withLoading } = useLoading()
    const firstLoadRef = useRef(true)

    useEffect(() => {
        const load = async () => {
            try {
                const key = firstLoadRef.current ? "page" : "refresh"
                await withLoading(key, async () => {
                    const [sess, acts, ars, stf, cls] = await Promise.all([
                        listSessions(),
                        listActivities(),
                        listAreas(),
                        listStaff(),
                        listClasses(),
                    ])

                    const rawSessions = Array.isArray(sess) ? sess : []
                    setSessions(rawSessions.filter(Boolean))
                    setActivities(acts || [])
                    setAreas(ars || [])
                    setStaff(stf || [])
                    setClasses(cls || [])
                })
            } catch (e) {
                console.error("Erro ao carregar grade", e)
            } finally {
                firstLoadRef.current = false
            }
        }
        load()
    }, [withLoading])

    return {
        sessions,
        activities,
        areas,
        staff,
        classes,
        isLoading
    }
}
