import { useMemo } from "react"
import { createEmptyClassForm } from "../Constants/classesDefaults"
import {
    getStartOfWeek,
    addDays,
    format
} from "../../../../utils/sharedUtils"

export const useClassGridLogic = ({ data, formState, setFormState, referenceDate }) => {

    // Computed Data
    const schedulesForGrid = useMemo(() => {
        const classesList = data?.classes || []
        const activitiesList = data?.activities || []
        const areasList = data?.areas || []
        const instructorsList = data?.instructors || []

        // Calcular fim da semana de referência
        const weekStart = getStartOfWeek(referenceDate)
        const weekEnd = addDays(weekStart, 6)
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

        return classesList
            .filter(cls => {
                // Filtrar turmas que ainda não começaram
                if (cls.startDate) {
                    // Se a turma tem startDate, só exibe se já começou até o fim da semana
                    return cls.startDate <= weekEndStr
                }
                // Se não tem startDate, exibe sempre (turmas antigas)
                return true
            })
            .filter(cls => {
                // Filtrar turmas que já terminaram
                if (cls.endDate) {
                    // Se a turma tem endDate, só exibe se ainda não terminou
                    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
                    return cls.endDate >= weekStartStr
                }
                // Se não tem endDate, exibe sempre
                return true
            })
            .map(cls => {
                const activity = activitiesList.find(a => a.id === cls.idActivity) || {}
                const area = areasList.find(a => a.id === cls.idArea) || {}
                const instructor = instructorsList.find(i => i.id === cls.idStaff) || {}

                return {
                    ...cls,
                    idClass: cls.id,

                    // Prefixos Padronizados para Grade
                    activityName: activity.name || 'Atividade',
                    activityColor: activity.color || '#556ee6',
                    areaName: area.name || 'Área',
                    employeeName: instructor.name || instructor.firstName || 'Instrutor',

                    // Flag para identificar como template na grade administrativa
                    isClassTemplate: true
                }
            })
    }, [data.classes, data.activities, data.areas, data.instructors, referenceDate])

    const instructorsForSelect = useMemo(() => {
        return (data?.instructors || []).filter(s => s.isInstructor || s.role === 'instructor')
    }, [data.instructors])

    // Handlers
    const handleClassClick = (schedule) => {
        if (!schedule) return

        const classId = schedule.idClass || schedule.id

        // TOGGLE DESELECT: Se clicar na mesma classe, limpa o form
        if (formState.id && formState.id === classId) {
            setFormState(createEmptyClassForm())
            return
        }

        const classObj = data.classes.find(c => c.id === classId)

        if (classObj) {
            // Cálculo da Data Efetiva (para exibição ou preenchimento de campos de data)
            let effectiveDateStr = format(new Date(), 'YYYY-MM-DD')

            if (schedule.sessionDate) {
                effectiveDateStr = schedule.sessionDate
            } else if (referenceDate && (classObj.weekday !== undefined && classObj.weekday !== null)) {
                const startOfWeek = getStartOfWeek(referenceDate)
                const targetDate = addDays(startOfWeek, Number(classObj.weekday))
                effectiveDateStr = format(targetDate, 'YYYY-MM-DD')
            }

            setFormState({
                ...createEmptyClassForm(),
                ...classObj,
                durationMinutes: Number(classObj.durationMinutes || 0),
                maxCapacity: Number(classObj.maxCapacity || 0),
                weekday: (classObj.weekday !== undefined && classObj.weekday !== null) ? Number(classObj.weekday) : null,
                effectiveDate: effectiveDateStr
            })

            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return {
        schedulesForGrid,
        instructorsForSelect,
        handleClassClick,
    }
}
