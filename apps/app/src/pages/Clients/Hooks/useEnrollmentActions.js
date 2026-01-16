import { useLoading } from "../../../hooks/useLoading"
import { useSystemSettings } from "../../../hooks/useSystemSettings"
import { useToast } from "../../../components/Common/ToastProvider"
import { listReceivablesByClient } from "../../../services/Receivables"
import { validateEnrollmentRules } from "../../../validators/enrollment/guards"
import { validateDuplicateEnrollment } from "../../../validators/enrollment/duplicates"
import { createRecurringEnrollment, createSingleSessionEnrollment, listEnrollmentsByClient } from "../../../services/Enrollments/index"
import { createExperimentalPayload, createRecurringPayload } from "../../../services/Enrollments/enrollment.helpers"
import { ENROLLMENT_TYPES } from "../../../services/Enrollments/enrollment.types"
import { getAuthUser } from "../../../helpers/permission_helper"

export const useEnrollmentActions = ({ clientId, clientName, clientPhone, selectedSessionKeys, schedulesForGrid, setSelectedSessionKeys, setExistingEnrollments, enrollmentType = 'regular', reloadPageData, setSessions }) => {
    const { isLoading, withLoading } = useLoading()
    const { settings } = useSystemSettings()
    const toast = useToast()

    const handleEnroll = async () => {
        if (!clientId) {
            toast.show({ title: "Cliente não identificado", color: "danger" })
            return
        }
        if (!selectedSessionKeys.length) {
            toast.show({ title: "Selecione ao menos uma sessão", color: "warning" })
            return
        }
        try {
            await withLoading('enroll', async () => {
                // Validação Financeira (Inadimplência)
                const allowDebt = settings?.sales?.allowEnrollmentWithDebt === true

                if (!allowDebt) {
                    const receivables = await listReceivablesByClient(clientId, { status: "open" })
                    const toleranceDays = Number(settings?.finance?.considerInadimplentAfterDays || 0)

                    const limitDate = new Date()
                    limitDate.setDate(limitDate.getDate() - toleranceDays)
                    // Formato YYYY-MM-DD para comparação com strings de data do Firestore
                    const limitDateISO = limitDate.toISOString().split('T')[0]

                    const hasOverdue = receivables.some(r => {
                        if (!r.dueDate) return false
                        return r.dueDate < limitDateISO
                    })

                    if (hasOverdue) {
                        throw new Error(`Cliente possui pendências financeiras vencidas há mais de ${toleranceDays} dias.Matrícula bloqueada pelas configurações do sistema.`)
                    }
                }

                // Match selected sessions with their data
                const selectedSessions = selectedSessionKeys
                    .map(key => {
                        const [id] = key.split("|")
                        const found = schedulesForGrid.find(s => (s.idSession || s.id) === id)
                        if (!found) return null

                        // Extract date from key if it exists
                        const [, date] = key.split("|")
                        return { ...found, sessionDate: date || found.sessionDate }
                    })
                    .filter(Boolean)

                const guard = await validateEnrollmentRules({ clientId, sessions: selectedSessions, enrollmentType })
                if (!guard.ok) {
                    toast.show({ title: "Matrícula bloqueada", description: guard.message, color: "warning" })
                    return
                }

                const duplicateCheck = await validateDuplicateEnrollment({ clientId, sessions: selectedSessions })
                if (!duplicateCheck.ok) {
                    toast.show({
                        title: "Matrícula duplicada",
                        description: duplicateCheck.message,
                        color: "warning"
                    })
                    return
                }

                // Experimental / Single Session Logic
                if (enrollmentType === ENROLLMENT_TYPES.EXPERIMENTAL) {
                    const user = getAuthUser()
                    for (const s of selectedSessions) {
                        const payload = createExperimentalPayload({
                            idClient: clientId,
                            clientName,
                            session: s,
                            status: "active"
                        })



                        await createSingleSessionEnrollment({
                            ...payload,
                            clientPhone,
                            idStaff: user?.uid || null,
                            staffName: user?.displayName || ""
                        })
                    }
                } else {
                    // Recurring Logic (Default)
                    const byClass = {}
                    selectedSessions.forEach(s => {
                        const idClass = s.idClass || s.idActivity
                        byClass[idClass] = byClass[idClass] || []
                        byClass[idClass].push(s)
                    })

                    for (const idClass of Object.keys(byClass)) {
                        const list = byClass[idClass]
                        const first = list[0]
                        if (!first) continue
                        const startDate = list
                            .map(s => s.sessionDate)
                            .filter(Boolean)
                            .sort()
                            .shift()

                        const payload = createRecurringPayload({
                            idClient: clientId,
                            clientName,
                            classData: first,
                            startDate,
                            status: "active"
                        })

                        // Ensure legacy fields if needed or rely on helper
                        await createRecurringEnrollment(payload)
                    }
                }

                toast.show({ title: enrollmentType === ENROLLMENT_TYPES.EXPERIMENTAL ? "Agendamento realizado" : "Matrícula realizada", color: "success" })

                // OTIMISMO: Atualizar ocupação na grade imediatamente
                if (setSessions) {
                    setSessions(prev =>
                        (Array.isArray(prev) ? prev : []).map(sess => {
                            const key = `${sess.idSession || sess.id}|${sess.sessionDate || ""}`
                            if (selectedSessionKeys.includes(key)) {
                                return {
                                    ...sess,
                                    enrolledCount: Number(sess.enrolledCount || 0) + 1
                                }
                            }
                            return sess
                        })
                    )
                }

                // Mantém na grade: limpa seleção e atualiza lista para bloquear duplicadas
                setSelectedSessionKeys([])

                // Se tiver setSessions, evitamos reloadPageData completo para não sobreescrever
                // a atualização otimista com dados "stale" do backend ainda não processado.
                // Apenas atualizamos a lista de matrículas existentes.
                if (setSessions && setExistingEnrollments) {
                    const enrollments = await listEnrollmentsByClient(clientId)
                    setExistingEnrollments(enrollments || [])
                } else if (reloadPageData) {
                    await reloadPageData()
                } else if (setExistingEnrollments) {
                    const enrollments = await listEnrollmentsByClient(clientId)
                    setExistingEnrollments(enrollments || [])
                }
            })
        } catch (e) {
            console.error("handleEnroll: Erro durante o processo", e)
            toast.show({ title: "Erro ao matricular", description: e?.message || String(e), color: "danger" })
        }
    }

    return {
        handleEnroll,
        isLoading
    }
}
