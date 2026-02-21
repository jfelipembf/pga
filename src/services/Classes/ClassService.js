import moment from 'moment'
import { classRepository } from '../../data/repositories/ClassRepository'
import { sessionRepository } from '../../data/repositories/SessionRepository'
import { CreateGradeSchema } from '../../data/schemas/Classes/ClassSchema'
import { ClassAuditLogger } from './audit/ClassAuditLogger'
import { query, where, getDocs, writeBatch, doc } from 'firebase/firestore'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { SessionFactory } from './SessionFactory'
import { SessionService } from './SessionService'
import { ClassRules } from './domain/ClassRules'

/**
 * Serviço para Gestão de Turmas e Sessões
 */
export const ClassService = {
    /**
     * Cria uma nova grade de aulas (Turmas + Sessões Futuras)
     */
    createGrade: async (idTenant, idBranch, user, formData) => {
        await CreateGradeSchema.validate(formData, { abortEarly: false })

        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const db = classRepository.db
        const mainBatch = writeBatch(db)
        const createdClasses = []

        for (const weekday of formData.weekdays) {
            const classRef = doc(classRepository.getCollectionRef(idTenant, idBranch))
            const classId = classRef.id

            const classData = {
                id: classId,
                ...ClassRules.buildClassCreatePayload(idTenant, idBranch, userId, formData, weekday)
            }

            mainBatch.set(classRef, classData)

            // Gerar sessões para esta turma específica no batch
            const sessionsCount = ClassService._generateSessionsBatch(
                mainBatch, idTenant, idBranch, userId,
                classData,
                formData.startDate, formData.endDate
            )

            createdClasses.push({ id: classId, weekday, sessionsCount })
        }

        await mainBatch.commit()

        await ClassAuditLogger.logGradeCreation({
            idTenant, idBranch, userId, userName,
            createdClasses,
            formData
        })

        return createdClasses
    },

    /**
     * Helper interno para adicionar geração de sessões a um batch existente
     * @private
     */
    _generateSessionsBatch: (batch, idTenant, idBranch, userId, classData, start, end, enrolledCount = 0) => {
        const { current, endLimit } = ClassRules.getSessionLimits(start, end)
        let count = 0

        // Encontrar primeiro dia válido da semana
        while (current.day() !== classData.weekday && current.isBefore(endLimit)) {
            current.add(1, 'day')
        }

        while (current.isSameOrBefore(endLimit)) {
            const sessionDate = current.format('YYYY-MM-DD')
            const sessionId = `${classData.id}-${sessionDate}`
            const sessionRef = doc(sessionRepository.getCollectionRef(idTenant, idBranch), sessionId)

            const sessionData = SessionFactory.create(
                idTenant, idBranch, userId,
                classData, sessionDate,
                { enrolledCount }
            )

            batch.set(sessionRef, sessionData)
            count++
            current.add(7, 'days')
        }
        return count
    },

    /**
     * Lista todas as turmas ativas
     */
    listClasses: async (idTenant, idBranch) => {
        return await classRepository.findActive(idTenant, idBranch)
    },

    /**
     * Busca uma turma por ID
     */
    getClassById: async (idTenant, idBranch, id) => {
        return await classRepository.findById(idTenant, idBranch, id)
    },

    /**
     * @deprecated Use SessionService.listByDateRange directly
     */
    listSessions: async (idTenant, idBranch, start, end) => {
        return await SessionService.listByDateRange(idTenant, idBranch, start, end)
    },

    /**
     * Atualiza uma turma e propaga mudanças para sessões futuras de forma atômica
     */
    updateClass: async (idTenant, idBranch, user, id, data) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const oldData = await classRepository.findById(idTenant, idBranch, id)
        if (!oldData) throw new Error("Turma não encontrada")

        const mainBatch = writeBatch(classRepository.db)
        const classRef = doc(classRepository.getCollectionRef(idTenant, idBranch), id)

        // 1. Atualizar Turma
        const updatePayload = ClassRules.buildClassUpdatePayload(userId, data, oldData)
        mainBatch.update(classRef, updatePayload)

        // 2. Propagar para Sessões Futuras
        try {
            const todayStr = moment().format('YYYY-MM-DD')
            const propagationPayload = ClassRules.buildSessionPropagationPayload(userId, data, oldData)
            const weekdayChanged = data.weekday !== undefined && parseInt(data.weekday) !== parseInt(oldData.weekday)

            if (propagationPayload || weekdayChanged) {
                const allSessions = await sessionRepository.findWhere(idTenant, idBranch, [['idClass', '==', id]])

                // Filtrar sessões candidatas à atualização
                const targetSessions = allSessions.filter(s =>
                    s.sessionDate >= todayStr &&
                    !s.attendanceRecorded &&
                    (!s.deletedAt && s.status !== 'canceled' || weekdayChanged)
                )

                if (weekdayChanged) {
                    // Se mudou o dia, cancelamos as futuras e geramos novas
                    targetSessions.forEach(session => {
                        const sRef = doc(sessionRepository.getCollectionRef(idTenant, idBranch), session.id)
                        mainBatch.update(sRef, ClassRules.buildSoftDeletePayload(userId, 'canceled'))
                    })

                    const activeEnrollments = await enrollmentRepository.findByClass(idTenant, idBranch, id)
                    ClassService._generateSessionsBatch(
                        mainBatch, idTenant, idBranch, userId,
                        { ...oldData, ...updatePayload, weekday: parseInt(data.weekday) },
                        todayStr, updatePayload.endDate || oldData.endDate, activeEnrollments.length
                    )
                } else if (propagationPayload) {
                    // Propagação de campos (horário, capacidade, instrutor, etc)
                    targetSessions.forEach(session => {
                        const sRef = doc(sessionRepository.getCollectionRef(idTenant, idBranch), session.id)

                        // Verificar se a sessão excedeu a nova data fim
                        const newEndDate = data.endDate || oldData.endDate
                        if (newEndDate && session.sessionDate > newEndDate) {
                            mainBatch.update(sRef, ClassRules.buildSoftDeletePayload(userId))
                        } else {
                            mainBatch.update(sRef, propagationPayload)
                        }
                    })
                }
            }
        } catch (error) {
            console.error("[ClassService] Erro na propagação de sessões:", error)
        }

        await mainBatch.commit()

        await ClassAuditLogger.logUpdate({
            idTenant, idBranch, userId, userName,
            idClass: id,
            oldData,
            newData: data
        })

        return { id, ...updatePayload }
    },

    /**
     * Exclui uma turma (Soft Delete) e cancela sessões futuras
     */
    deleteClass: async (idTenant, idBranch, user, id, fromDate = null) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const oldData = await classRepository.findById(idTenant, idBranch, id)
        if (!oldData) throw new Error("Turma não encontrada")

        const mainBatch = writeBatch(classRepository.db)
        const classRef = doc(classRepository.getCollectionRef(idTenant, idBranch), id)

        // 1. Soft delete da turma
        mainBatch.update(classRef, ClassRules.buildSoftDeletePayload(userId))

        // 2. Buscar e cancelar sessões
        const sessionsCollectionRef = sessionRepository.getCollectionRef(idTenant, idBranch)
        let q = query(sessionsCollectionRef, where('idClass', '==', id))
        if (fromDate) {
            q = query(sessionsCollectionRef, where('idClass', '==', id), where('sessionDate', '>=', fromDate))
        }

        const sessionsSnapshot = await getDocs(q)
        sessionsSnapshot.docs.forEach(docSnap => {
            mainBatch.update(docSnap.ref, ClassRules.buildSoftDeletePayload(userId, 'canceled'))
        })

        await mainBatch.commit()

        await ClassAuditLogger.logDeletion({
            idTenant, idBranch, userId, userName,
            idClass: id,
            fromDate,
            deletedSessionsCount: sessionsSnapshot.size
        })

        return { id, deletedSessionsCount: sessionsSnapshot.size }
    },

    /**
     * @deprecated Use AttendanceService.recordAttendance() directly
     */
    saveAttendance: async (idTenant, idBranch, user, idSession, attendanceData) => {
        const { AttendanceService } = await import('./AttendanceService')
        return AttendanceService.recordAttendance(idTenant, idBranch, user, idSession, attendanceData)
    },

    /**
     * Retorna os alunos matriculados em uma turma
     */
    getclientsForClass: async (idTenant, idBranch, idClass) => {
        return await enrollmentRepository.findByClass(idTenant, idBranch, idClass)
    }
}
