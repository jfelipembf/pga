import { useState, useMemo, useCallback } from "react"
import { useToast } from "../../../components/Common/ToastProvider"

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
        return (sessions || []).map(sess => {
            const activity = activities.find(a => a.id === sess.idActivity) || {}
            const area = areas.find(a => a.id === sess.idArea) || {}
            const instructor = staff.find(i => i.id === sess.idStaff) || {}
            const weekday =
                sess.weekday !== undefined && sess.weekday !== null ? Number(sess.weekday) : null
            return {
                id: sess.idSession || sess.id,
                idSession: sess.idSession || sess.id,
                idActivity: sess.idActivity,
                idClass: sess.idClass || sess.idActivity, // fallback
                idStaff: sess.idStaff || null,
                activityName: activity.name || sess.idActivity,
                areaName: area.name || "",
                employeeName:
                    instructor.name || `${instructor.firstName || ""} ${instructor.lastName || ""} `.trim(),
                startTime: sess.startTime || "",
                endTime: sess.endTime || "",
                startDate: sess.sessionDate || null,
                endDate: sess.sessionDate || null,
                sessionDate: sess.sessionDate || null,
                weekDays: weekday !== null ? [weekday] : [],
                weekday,
                color: activity.color || "#466b8f",
                maxCapacity: Number(sess.maxCapacity || 0),
                enrolledCount: Number(sess.enrolledCount || 0),
                isAlreadyEnrolled: isSessionAlreadyEnrolled(sess),
            }
        })
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
