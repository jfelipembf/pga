import { useEffect } from "react"
import { useToast } from "components/Common/ToastProvider"
import { useLoading } from "../../../../hooks/useLoading"
import { useClassesData } from "./useClassesData"
import { useClassFormLogic } from "./useClassFormLogic"
import { useClassGridLogic } from "./useClassGridLogic"

export const useClassesPage = ({ setBreadcrumbItems }) => {
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()

    // 1. Data Layer
    const data = useClassesData({ withLoading, toast })

    // 2. Form Logic Layer
    const formLogic = useClassFormLogic({
        toast,
        withLoading,
        reloadData: data.reloadClassesAndSessions
    })

    // 3. Grid Logic Layer
    const gridLogic = useClassGridLogic({
        data,
        formState: formLogic.formState,
        setFormState: formLogic.setFormState
    })

    // 4. Page Effects
    useEffect(() => {
        if (setBreadcrumbItems) {
            const breadcrumbs = [
                { title: "Administrativo", link: "/admin" },
                { title: "Turmas", link: "/admin/classes" },
            ]
            setBreadcrumbItems("Turmas", breadcrumbs)
        }
    }, [setBreadcrumbItems])

    const isInitialLoading =
        isLoading("page") &&
        data.activities.length === 0 &&
        data.areas.length === 0 &&
        data.instructors.length === 0

    // 5. Public API
    return {
        ...formLogic, // formState, setFormState, showDeleteConfirm, handlers...
        ...gridLogic, // schedulesForGrid, instructorsForSelect, handleClassClick

        // Data (exposed for other uses if needed)
        activities: data.activities,
        areas: data.areas,
        instructors: gridLogic.instructorsForSelect, // Use filtered list

        // UI State
        isLoading,
        isInitialLoading,
    }
}

