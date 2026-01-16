import { listEnrollmentsByClient } from "../../services/Enrollments/index"

/**
 * Verifica se o cliente já está matriculado em alguma das turmas/sessões selecionadas
 */
export const validateDuplicateEnrollment = async ({ clientId, sessions = [] }) => {
  if (!clientId) {
    return { ok: false, message: "Cliente não identificado." }
  }

  if (!sessions.length) {
    return { ok: true }
  }

  try {
    const existingEnrollments = await listEnrollmentsByClient(clientId)

    if (!existingEnrollments?.length) {
      return { ok: true }
    }

    const duplicates = []

    for (const session of sessions) {
      const classDuplicate = existingEnrollments.find(enrollment => {
        const enrollmentClassId = enrollment.idClass || enrollment.idActivity
        const sessionClassId = session.idClass || session.idActivity
        return (
          enrollmentClassId === sessionClassId &&
          (enrollment.status || "").toLowerCase() === "active"
        )
      })

      const sessionDuplicate = existingEnrollments.find(enrollment => {
        return (
          (enrollment.idSession === session.idSession || enrollment.id === session.idSession) &&
          (enrollment.status || "").toLowerCase() === "active"
        )
      })

      if (classDuplicate) {
        duplicates.push({
          type: "class",
          session,
          existing: classDuplicate,
          message: `Aluno já matriculado na turma ${session.className || session.activityName || session.name}`,
        })
      } else if (sessionDuplicate) {
        duplicates.push({
          type: "session",
          session,
          existing: sessionDuplicate,
          message: `Aluno já matriculado nesta sessão em ${session.className || session.activityName || session.name}`,
        })
      }
    }

    if (duplicates.length > 0) {
      const duplicateMessages = duplicates.map(d => d.message)
      const uniqueMessages = [...new Set(duplicateMessages)]

      return {
        ok: false,
        message: `Matrícula duplicada detectada:\n${uniqueMessages.join("\n")}`,
        existingEnrollments: duplicates,
      }
    }

    return { ok: true }
  } catch (error) {
    console.error("Erro ao validar duplicidade de matrícula:", error)
    return { ok: true }
  }
}

/**
 * Verifica se o cliente já está matriculado em uma turma específica
 */
export const isAlreadyEnrolledInClass = async (clientId, classId) => {
  if (!clientId || !classId) return false

  try {
    const enrollments = await listEnrollmentsByClient(clientId)
    return (
      enrollments?.some(enrollment => {
        const enrollmentClassId = enrollment.idClass || enrollment.idActivity
        return (
          enrollmentClassId === classId && (enrollment.status || "").toLowerCase() === "active"
        )
      }) || false
    )
  } catch (error) {
    console.error("Erro ao verificar matrícula existente:", error)
    return false
  }
}

/**
 * Filtra turmas onde o cliente já está matriculado
 */
export const filterAvailableClasses = async (clientId, classes = []) => {
  if (!clientId || !classes.length) return classes

  try {
    const enrollments = await listEnrollmentsByClient(clientId)
    if (!enrollments?.length) return classes

    const enrolledClassIds = new Set(
      enrollments
        .filter(e => (e.status || "").toLowerCase() === "active")
        .map(e => e.idClass || e.idActivity)
        .filter(Boolean)
    )

    return classes.filter(cls => {
      const classId = cls.idClass || cls.idActivity || cls.id
      return !enrolledClassIds.has(classId)
    })
  } catch (error) {
    console.error("Erro ao filtrar turmas disponíveis:", error)
    return classes
  }
}
