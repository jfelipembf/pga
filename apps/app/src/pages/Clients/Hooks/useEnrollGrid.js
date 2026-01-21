import { useState, useMemo, useCallback } from "react"
import { useToast } from "../../../components/Common/ToastProvider"
import { mapToGridFormat } from "@pga/shared"

export const useEnrollGrid = ({ sessions, activities, areas, staff, existingEnrollments }) => {
    const [selectedSessionKeys, setSelectedSessionKeys] = useState([])
    const toast = useToast()

    // Verificar se sessão já está matriculada
    const isSessionAlreadyEnrolled = useCallback((session) => {
        if (!existingEnrollments.length) return false

        // Verificar matrícula na mesma turma
        const classDuplicate = existingEnrollments.find(enrollment => {
            const enrollmentClassId = enrollment.idClass || enrollment.idActivity
            const sessionClassId = session.idClass || session.idActivity
            return enrollmentClassId === sessionClassId &&
                (enrollment.status || "").toLowerCase() === "active"
        })

        // Verificar matrícula na mesma sessão específica
        const sessionDuplicate = existingEnrollments.find(enrollment => {
            return (enrollment.idSession === session.idSession || enrollment.id === session.idSession) &&
                (enrollment.status || "").toLowerCase() === "active"
        })

        return !!(classDuplicate || sessionDuplicate)
    }, [existingEnrollments])

    const schedulesForGrid = useMemo(() => {
        const mapped = mapToGridFormat({
            sessions,
            activities,
            areas,
            instructors: staff,
        })

        return mapped.map(s => ({
            ...s,
            isAlreadyEnrolled: isSessionAlreadyEnrolled(s.originalData || s)
        }))
    }, [sessions, activities, areas, staff, isSessionAlreadyEnrolled])

    const toggleSelection = (session, isoDate) => {
        // Impedir seleção se já estiver matriculado
        if (session.isAlreadyEnrolled) {
            toast.show({
                title: "Matrícula existente",
                description: `Aluno já matriculado em ${session.activityName || session.className || session.name} `,
                color: "warning"
            })
            return
        }

        const key = `${session.idSession || session.id}|${isoDate || session.sessionDate || ""}`
        setSelectedSessionKeys(prev => {
            if (prev.includes(key)) return prev.filter(k => k !== key)
            return [...prev, key]
        })
    }

    return {
        schedulesForGrid,
        selectedSessionKeys,
        setSelectedSessionKeys,
        toggleSelection
    }
}
