import { useState, useCallback, useEffect } from "react"
import { listActivities } from "../../../services/Activity"
import { listAreas } from "../../../services/Areas/index"
import { listStaff } from "../../../services/Staff/index"
import { listClasses, listSessions } from "../../../services/Classes"
import { listEnrollmentsByClient } from "../../../services/Enrollments/index"
import { getClient } from "../../../services/Clients"
import { sortClassesByCreated, buildClassOrderMap, sortSessionsWithClassOrder } from "../../Grade/Utils/sortUtils"
import { useToast } from "../../../components/Common/ToastProvider"
import { useLoading } from "../../../hooks/useLoading"

export const useEnrollPageData = (clientId) => {
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const [classes, setClasses] = useState([])
    const [sessions, setSessions] = useState([])
    const [existingEnrollments, setExistingEnrollments] = useState([])
    const [client, setClient] = useState(null)
    const { isLoading, withLoading } = useLoading()
    const toast = useToast()

    const loadData = useCallback(async () => {
        if (!clientId) return
        try {
            await withLoading('page', async () => {
                const [acts, ars, stf, cls, sess, enrollments, clientData] = await Promise.all([
                    listActivities(),
                    listAreas(),
                    listStaff(),
                    listClasses(),
                    listSessions(),
                    listEnrollmentsByClient(clientId),
                    getClient(clientId),
                ])
                const orderedClasses = sortClassesByCreated(cls)
                const classOrder = buildClassOrderMap(orderedClasses)
                const sortSessions = list => sortSessionsWithClassOrder(list, classOrder)
                setActivities(acts || [])
                setAreas(ars || [])
                setStaff(stf || [])
                setClasses(orderedClasses)
                setSessions(sortSessions(sess))
                setExistingEnrollments(enrollments || [])
                setClient(clientData || null)
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro ao carregar dados", description: e?.message || String(e), color: "danger" })
        }
    }, [clientId, toast, withLoading])

    useEffect(() => {
        loadData()
    }, [loadData])

    return {
        activities,
        areas,
        staff,
        classes,
        sessions,
        setSessions,
        existingEnrollments,
        client,
        setExistingEnrollments,
        isLoading,
        loadData
    }
}
