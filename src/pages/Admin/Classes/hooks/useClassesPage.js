import { useState, useEffect } from "react"
import { useTenant } from "../../../../hooks/useTenant"
import { useLoading } from "../../../../hooks/useLoading"
import { toast } from "react-toastify"
import { listClasses } from "../../../../services/Classes"
import { listActivities } from "../../../../services/Activity"
import { listAreas } from "../../../../services/Areas"
import { listStaff } from "../../../../services/Staff"
import { useClassFormLogic } from "./useClassFormLogic"
import { useClassGridLogic } from "./useClassGridLogic"

export const useClassesPage = ({ setBreadcrumbItems, referenceDate }) => {
    const { idTenant, idBranch } = useTenant()
    const { isLoading, withLoading } = useLoading()

    const [data, setData] = useState({ classes: [], sessions: [] })
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [instructors, setInstructors] = useState([])
    const [isInitialLoading, setIsInitialLoading] = useState(true)

    // Breadcrumbs
    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Turmas", link: "/admin/classes" }
        ]
        setBreadcrumbItems("Gestão de Turmas", breadcrumbItems)
    }, [setBreadcrumbItems])

    // Load data
    const loadData = async () => {
        try {
            const [classesData, activitiesData, areasData, staffData] = await Promise.all([
                listClasses(idTenant, idBranch),
                listActivities(idTenant, idBranch),
                listAreas(idTenant, idBranch),
                listStaff(idTenant, idBranch)
            ])

            setData({ classes: classesData || [], sessions: [] })
            setActivities(activitiesData || [])
            setAreas(areasData || [])
            setInstructors(staffData || [])
        } catch (error) {
            console.error("Error loading classes data:", error)
            toast.error("Erro ao carregar dados")
        } finally {
            setIsInitialLoading(false)
        }
    }

    useEffect(() => {
        if (idTenant && idBranch) {
            loadData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idTenant, idBranch])

    const formLogic = useClassFormLogic({ 
        toast, 
        withLoading, 
        reloadData: loadData 
    })

    const gridLogic = useClassGridLogic({
        data,
        formState: formLogic.formState,
        setFormState: formLogic.setFormState,
        referenceDate
    })

    return {
        ...formLogic,
        ...gridLogic,
        isLoading,
        isInitialLoading,
        activities,
        areas,
        instructors
    }
}
