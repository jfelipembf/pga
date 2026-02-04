import { useMemo } from "react"
import { createEmptyClassForm } from "../Constants"
import { addDays, getDay, parseISO, format } from "date-fns"

export const useClassGridLogic = ({ data, formState, setFormState, referenceDate }) => {

    // Computed Data
    // Computed Data
    const schedulesForGrid = useMemo(() => {
        // Mapeamento explícito para a Grade de Turmas (Classes)
        // Aqui mostramos 'data.classes' (templates) principalmente
        const mappedClasses = (data.classes || []).map(cls => {
            const activity = data.activities.find(a => a.id === cls.idActivity) || {}
            const area = data.areas.find(a => a.id === cls.idArea) || {}
            const instructor = data.instructors.find(i => i.id === cls.idStaff) || {}

            return {
                id: cls.id,
                idClass: cls.id,

                // Prefixos Padronizados
                idActivity: cls.idActivity,
                idArea: cls.idArea,
                idStaff: cls.idStaff,

                // Dados visuais
                activityName: activity.name || 'Atividade',
                activityColor: activity.color || '#4CAF50',
                areaName: area.name || 'Área',
                areaColor: area.color || '#2196F3',
                instructorName: instructor.name || 'Instrutor',

                // Campos de Grade
                startTime: cls.startTime,
                endTime: cls.endTime,
                maxCapacity: cls.maxCapacity || 20,
                enrolledCount: cls.enrolledCount || 0,
                isActive: cls.isActive !== false,

                // Para turmas (templates), usamos weekday em vez de sessionDate
                weekday: cls.weekday,
                // Flag para distinguir de sessão
                isClassTemplate: true
            }
        })

        // Se precisarmos misturar sessions aqui (dependendo da sua regra de negócio original), 
        // mapeie data.sessions da mesma forma que fizemos na Grade.
        // Por padrão no useClassGridLogic, o foco costuma ser os templates.

        return mappedClasses
    }, [data.classes, data.activities, data.areas, data.instructors])

    const instructorsForSelect = useMemo(() => {
        return data.instructors.filter(s => s.isInstructor)
    }, [data.instructors])

    // Handlers
    const handleClassClick = (schedule) => {
        if (!schedule) return

        const classId = schedule.idClass

        // TOGGLE DESELECT: If clicking the same class currently being edited, reset the form.
        if (formState.id && formState.id === classId) {
            setFormState(createEmptyClassForm())
            return
        }

        // 1. Tentar achar o objeto original da Turma (Template)
        let classObj = data.classes.find(c => c.id === classId)

        // 2. Se não achar (turma excluída), mas for uma sessão, usar os dados da própria sessão como base
        if (!classObj && schedule.isSession && schedule.originalData) {
            const sd = schedule.originalData
            classObj = {
                id: sd.idClass,
                idActivity: sd.idActivity,
                idStaff: sd.idStaff,
                idArea: sd.idArea,
                startTime: sd.startTime,
                endTime: sd.endTime,
                weekday: sd.weekday,
                maxCapacity: sd.maxCapacity,
                color: sd.color,
                name: sd.name || "Turma (Encerrada)"
            }
        }

        if (classObj) {
            // Calcular Effective Date automático
            let effectiveDateStr = new Date().toISOString().split('T')[0]

            // Se o clique veio de uma data específica da grade (isoDate), usamos ela!
            if (schedule.sessionDate) {
                effectiveDateStr = schedule.sessionDate
            } else if (referenceDate && (classObj.weekday !== undefined && classObj.weekday !== null)) {
                // Fallback: cálculo baseado na semana em foco
                const ref = referenceDate instanceof Date ? referenceDate : parseISO(referenceDate)
                const startOfWeek = addDays(ref, -getDay(ref))
                const targetDate = addDays(startOfWeek, Number(classObj.weekday))
                effectiveDateStr = format(targetDate, 'yyyy-MM-dd')
            }

            setFormState({
                ...createEmptyClassForm(),
                ...classObj,
                // Ensure numeric fields are numbers
                durationMinutes: Number(classObj.durationMinutes || 0),
                maxCapacity: Number(classObj.maxCapacity || 0),
                startTime: classObj.startTime || "",
                weekday: (classObj.weekday !== undefined && classObj.weekday !== null) ? Number(classObj.weekday) : null,
                effectiveDate: effectiveDateStr
            })
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return {
        schedulesForGrid,
        instructorsForSelect,
        handleClassClick,
    }
}
