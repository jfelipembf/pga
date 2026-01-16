import { useState, useEffect, useRef } from "react"
import { listSessions, listClasses } from "../../../services/Classes"
import { listActivities } from "../../../services/Activity"
import { listAreas } from "../../../services/Areas/index"
import { listStaff } from "../../../services/Staff/staff.service"
import { useLoading } from "../../../hooks/useLoading"

export const useGradeData = (referenceDate) => {
    const [sessions, setSessions] = useState([])
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const { isLoading, withLoading } = useLoading()
    const firstLoadRef = useRef(true)

    useEffect(() => {
        const load = async () => {
            try {
                const key = firstLoadRef.current ? "page" : "refresh"
                await withLoading(key, async () => {
                    // Calculate date range (start of month - 7 days to end of month + 7 days)
                    // to cover month view and cross-week views safely.
                    const refDate = new Date(referenceDate)
                    const y = refDate.getFullYear()
                    const m = refDate.getMonth()

                    // Simple range: current month view +/- buffer
                    // Actually, let's just grab 2 months window around refDate to be safe and simple
                    // Start: 1st of previous month
                    const startDateObj = new Date(y, m - 1, 1)
                    // End: Last day of next month
                    const endDateObj = new Date(y, m + 2, 0)

                    const startDate = startDateObj.toISOString().split("T")[0]
                    const endDate = endDateObj.toISOString().split("T")[0]

                    const [sess, acts, ars, stf] = await Promise.all([
                        listSessions({ startDate, endDate, limitCount: 1000 }),
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
                })
            } catch (e) {
                console.error("Erro ao carregar grade", e)
            } finally {
                firstLoadRef.current = false
            }
        }
        load()
    }, [referenceDate, withLoading])

    return {
        sessions,
        setSessions,
        activities,
        areas,
        staff,
        loading: isLoading("page") || isLoading("refresh"),
    }
}
