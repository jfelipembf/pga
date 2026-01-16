import { useMemo } from "react"
import { mapSessionsToSchedules } from "../Utils"
import { createEmptyClassForm } from "../Constants"

export const useClassGridLogic = ({ data, formState, setFormState }) => {

    // Computed Data
    const schedulesForGrid = useMemo(() => {
        return mapSessionsToSchedules({
            sessions: data.sessions,
            activities: data.activities,
            areas: data.areas,
            instructors: data.instructors,
        })
    }, [data.sessions, data.activities, data.areas, data.instructors])

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

        // Find the original class object
        const classObj = data.classes.find(c => c.id === classId)

        if (classObj) {
            setFormState({
                ...createEmptyClassForm(),
                ...classObj,
                // Ensure numeric fields are numbers
                durationMinutes: Number(classObj.durationMinutes || 0),
                maxCapacity: Number(classObj.maxCapacity || 0),
                startTime: classObj.startTime || "",
                // Weekdays array might need check
                weekDays: Array.isArray(classObj.weekDays) ? classObj.weekDays : (classObj.weekday !== null ? [classObj.weekday] : [])
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
