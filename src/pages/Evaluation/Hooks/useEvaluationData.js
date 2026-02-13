import { useState, useEffect, useRef } from "react"
import moment from "moment"
import { ClassService, SessionService } from "../../../services/Classes"
import { listActivities, listAreas, listStaff } from "../../../services/Admin"
import { useLoading } from "../../../hooks/useLoading"
import { useTenant } from "../../../hooks/useTenant"
import { getStartOfWeek, addDays } from "../../../utils/date"
import { SessionMapper } from "../../../services/Classes/SessionMapper"

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
                        SessionService.listByDateRange(idTenant, idBranch, startStr, endStr),
                        listActivities(idTenant, idBranch),
                        listAreas(idTenant, idBranch),
                        listStaff(idTenant, idBranch),
                        ClassService.listClasses(idTenant, idBranch),
                    ])

                    // Usar o Mapper centralizado para normalização
                    const normalized = SessionMapper.toUIList(sess)

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
