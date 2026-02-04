import { useState, useEffect, useCallback } from "react"
import moment from "moment"
import { useTenant } from "../../../hooks/useTenant"
import { SessionService } from "../../../services/Admin/SessionService"
import { ActivityService } from "../../../services/Admin/ActivityService"
import { AreaService } from "../../../services/Admin/AreaService"
import { StaffService } from "../../../services/Admin/StaffService"
import { getStartOfWeek, addDays } from "../../../utils/sharedUtils"
import { toast } from "react-toastify"

export const useGradeData = (referenceDate) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [sessions, setSessions] = useState([])
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        if (!isReady) return

        try {
            setLoading(true)

            // Get date range for the current week based on referenceDate
            const startDate = getStartOfWeek(referenceDate)
            const endDate = addDays(startDate, 6)

            const [
                sessionsData,
                activitiesData,
                areasData,
                staffData
            ] = await Promise.all([
                SessionService.listByDateRange(idTenant, idBranch, moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')),
                ActivityService.listAll(idTenant, idBranch),
                AreaService.listAreas(idTenant, idBranch),
                StaffService.listAll(idTenant, idBranch)
            ])



            // Normalização de dados (Mapper)
            const normalizedSessions = (sessionsData || []).map(s => ({
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
                status: s.status || 'scheduled',
                // Auditoria
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                updatedBy: s.updatedBy || null,
                idTenant: s.idTenant,
                idBranch: s.idBranch
            })).filter(s => !s.deleted && s.sessionDate && s.startTime)

            setSessions(normalizedSessions)
            setActivities(activitiesData || [])
            setAreas(areasData || [])
            setStaff(staffData || [])
        } catch (error) {
            console.error("Error loading grade data:", error)
            toast.error("Erro ao carregar dados da grade")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady, referenceDate])

    useEffect(() => {
        loadData()
    }, [loadData])

    return {
        sessions,
        setSessions,
        activities,
        areas,
        staff,
        loading,
        refresh: loadData
    }
}
