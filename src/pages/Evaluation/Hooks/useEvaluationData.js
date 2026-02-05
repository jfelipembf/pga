import { useState, useMemo, useEffect, useRef } from "react"
import moment from "moment"
import { ClassService } from "../../../services/Classes/ClassService"
import { listActivities } from "../../../services/Activity"
import { listAreas } from "../../../services/Areas/index"
import { listStaff } from "../../../services/Staff/index"
import { useLoading } from "../../../hooks/useLoading"
import { useTenant } from "../../../hooks/useTenant"
import { getStartOfWeek, addDays } from "../../../utils/sharedUtils"

export const useEvaluationData = (referenceDate) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [sessions, setSessions] = useState([])

    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const [classes, setClasses] = useState([])
    const { isLoading, withLoading } = useLoading()
    const firstLoadRef = useRef(true)

    useEffect(() => {
        if (!isReady) return

        const load = async () => {
            try {
                const key = firstLoadRef.current ? "page" : "refresh"

                // Calculamos o intervalo da semana para buscar as sessões
                const startDate = getStartOfWeek(referenceDate || new Date())
                const endDate = addDays(startDate, 6)
                const startStr = moment(startDate).format('YYYY-MM-DD')
                const endStr = moment(endDate).format('YYYY-MM-DD')

                await withLoading(key, async () => {
                    const [sess, acts, ars, stf, cls] = await Promise.all([
                        ClassService.listSessions(idTenant, idBranch, startStr, endStr),
                        listActivities(idTenant, idBranch),
                        listAreas(idTenant, idBranch),
                        listStaff(idTenant, idBranch),
                        ClassService.listClasses(idTenant, idBranch),
                    ])

                    // Normalização robusta similar ao useGradeData
                    const rawSessions = Array.isArray(sess) ? sess : []
                    const normalized = rawSessions.map(s => {
                        if (!s) return null
                        return {
                            ...s,
                            id: s.id || s.idSession,
                            idSession: s.idSession || s.id,
                            sessionDate: s.sessionDate || s.date || s.activityDate,
                            startTime: String(s.startTime || "").trim(),
                            endTime: String(s.endTime || "").trim(),
                            idActivity: s.idActivity || s.activityId || s.id_activity,
                            idArea: s.idArea || s.areaId || s.id_area || s.locationId || s.idLocation,
                            idStaff: s.idStaff || s.staffId || s.idInstructor || s.instructorId || s.id_staff,
                            weekday: s.weekday !== undefined ? Number(s.weekday) : null,
                            deleted: s.deleted || false,
                            isActive: s.isActive !== false,
                            status: s.status || 'scheduled'
                        }
                    }).filter(s => s && !s.deleted && !s.deletedAt && s.sessionDate && s.startTime)

                    setSessions(normalized)
                    setActivities(acts || [])
                    setAreas(ars || [])
                    setStaff(stf || [])
                    setClasses(cls || [])
                })
            } catch (e) {
                console.error("Erro ao carregar dados de avaliação", e)
            } finally {
                firstLoadRef.current = false
            }
        }
        load()
    }, [withLoading, idTenant, idBranch, isReady, referenceDate])

    return {
        sessions,
        activities,
        areas,
        staff,
        classes,
        isLoading
    }
}
