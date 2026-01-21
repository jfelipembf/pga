import { useMemo } from "react"
import { mapToGridFormat } from "@pga/shared"
import { createEmptyClassForm } from "../Constants"

export const useClassGridLogic = ({ data, formState, setFormState }) => {

    // Computed Data
    const schedulesForGrid = useMemo(() => {
        return mapToGridFormat({
            sessions: [], // Admin view focuses on editing Class templates
            classes: data.classes,
            activities: data.activities,
            areas: data.areas,
            instructors: data.instructors,
        })
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
                weekday: (classObj.weekday !== undefined && classObj.weekday !== null) ? Number(classObj.weekday) : null
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
