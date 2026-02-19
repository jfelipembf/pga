import moment from 'moment'
import { classRepository } from '../../data/repositories/ClassRepository'
import { sessionRepository } from '../../data/repositories/SessionRepository'
import { CreateGradeSchema } from '../../data/schemas/Classes/ClassSchema'
import { AuditService } from '../Core/AuditService'
import { timeToMinutes } from '../../utils/date'
import { query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { normalizeDate } from '../../utils/date'
import { SessionFactory } from './SessionFactory'
import { SessionService } from './SessionService'

/**
 * Serviço para Gestão de Turmas e Sessões
 */
export const ClassService = {
    /**
     * Cria uma nova grade de aulas. 
     */
    createGrade: async (idTenant, idBranch, user, formData) => {
        await CreateGradeSchema.validate(formData, { abortEarly: false })

        const {
            idActivity, idArea, idStaff, weekdays,
            startTime, endTime, startDate, endDate,
            maxCapacity, isActive
        } = formData

        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'
        const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime)

        const db = classRepository.db
        const mainBatch = writeBatch(db)
        const createdClasses = []

        for (const weekday of weekdays) {
            const classRef = doc(classRepository.getCollectionRef(idTenant, idBranch))
            const classId = classRef.id

            const classData = {
                id: classId,
                idActivity, idArea, idStaff, weekday,
                startTime, endTime, durationMinutes,
                startDate, endDate: endDate || null,
                maxCapacity,
                isActive: isActive !== false,
                status: 'active',
                idTenant, idBranch,
                createdBy: userId, updatedBy: userId,
                createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
                deletedAt: null
            }

            mainBatch.set(classRef, classData)

            // Gerar sessões para esta turma específica no batch
            const sessionsCount = ClassService._generateSessionsBatch(
                mainBatch, idTenant, idBranch, userId,
                { ...classData, id: classId },
                startDate, endDate
            )

            createdClasses.push({ id: classId, weekday, sessionsCount })
        }

        await mainBatch.commit()

        // Logging Auditoria (simplificado para o lote)
        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'GRADE_CREATED',
            entityType: 'grade',
            entityId: 'multiple',
            description: `Grade criada com ${weekdays.length} turmas e suas sessões.`,
            details: { createdClasses, formData }
        })

        return createdClasses
    },

    /**
     * Helper interno para adicionar geração de sessões a um batch existente
     * @private
     */
    _generateSessionsBatch: (batch, idTenant, idBranch, userId, classData, start, end, enrolledCount = 0) => {
        let current = moment(start).startOf('day')
        const endLimit = end ? moment(end).endOf('day') : moment(start).add(6, 'months').endOf('day')

        // Blindagem extra: impedir anos absurdos
        if (endLimit.year() > 2100) {
            endLimit.year(2100);
        }

        let count = 0

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
     * Lista todas as turmas da grade
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
     * Mantido para compatibilidade com imports diretos do arquivo ClassService.js
     */
    listSessions: async (idTenant, idBranch, start, end) => {
        return await SessionService.listByDateRange(idTenant, idBranch, start, end)
    },

    /**
     * Atualiza uma turma existente
     */
    updateClass: async (idTenant, idBranch, user, id, data) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const oldData = await classRepository.findById(idTenant, idBranch, id)
        if (!oldData) throw new Error("Turma não encontrada")

        const db = classRepository.db
        const mainBatch = writeBatch(db)
        const classRef = doc(classRepository.getCollectionRef(idTenant, idBranch), id)

        // 1. Preparar campos da Turma
        const updateData = {
            ...data,
            updatedBy: userId,
            updatedAt: serverTimestamp()
        }

        if (data.startTime || data.endTime) {
            const start = data.startTime || oldData.startTime
            const end = data.endTime || oldData.endTime
            updateData.durationMinutes = timeToMinutes(end) - timeToMinutes(start)
        }

        // Adiciona update da Turma no Batch
        mainBatch.update(classRef, updateData)

        // 2. Propagar para Sessões Futuras
        try {
            const todayStr = moment().format('YYYY-MM-DD')
            const propagationMapping = {
                idActivity: 'idActivity',
                idArea: 'idArea',
                idStaff: 'idStaff',
                startTime: 'startTime',
                endTime: 'endTime',
                maxCapacity: 'maxCapacity',
                isActive: 'isActive',
                endDate: 'endDate' // Adicionado para garantir propagação da Data Fim nas sessões
            }

            const changedFields = {}
            Object.keys(propagationMapping).forEach(field => {
                const newVal = data[field] === undefined ? oldData[field] : data[field]
                if (String(newVal || '') !== String(oldData[field] || '')) {
                    changedFields[propagationMapping[field]] = newVal
                }
            })

            if (changedFields.startTime || changedFields.endTime) {
                const s = changedFields.startTime || oldData.startTime
                const e = changedFields.endTime || oldData.endTime
                changedFields.durationMinutes = timeToMinutes(e) - timeToMinutes(s)
            }

            const weekdayChanged = data.weekday !== undefined && parseInt(data.weekday) !== parseInt(oldData.weekday)

            if (Object.keys(changedFields).length > 0 || weekdayChanged) {
                // Seleção focada: Filtramos por idClass (índice automático) para carregar apenas
                // os docs desta turma. A filtragem por data e status é feita em memória para
                // evitar a obrigatoriedade de Índices Compostos manuais no Firebase,
                // mantendo 99.9% de eficiência sem risco de erros de 'Missing Index'.
                const allSessions = await sessionRepository.findWhere(idTenant, idBranch, [['idClass', '==', id]])

                const futureSessions = allSessions.filter(s =>
                    s.sessionDate >= todayStr &&
                    (s.attendanceRecorded === false || s.attendanceRecorded === undefined) &&
                    ((!s.deletedAt && s.status !== 'canceled') || weekdayChanged)
                )

                if (weekdayChanged) {
                    futureSessions.forEach(session => {
                        const sRef = doc(sessionRepository.getCollectionRef(idTenant, idBranch), session.id)
                        mainBatch.update(sRef, {
                            deletedAt: normalizeDate(new Date()),
                            deletedBy: userId,
                            isActive: false,
                            status: 'canceled',
                            updatedBy: userId,
                            updatedAt: serverTimestamp()
                        })
                    })

                    const activeEnrollments = await enrollmentRepository.findByClass(idTenant, idBranch, id)
                    ClassService._generateSessionsBatch(
                        mainBatch, idTenant, idBranch, userId,
                        { ...oldData, ...updateData, weekday: parseInt(data.weekday) },
                        todayStr, oldData.endDate, activeEnrollments.length
                    )
                } else {
                    futureSessions.forEach(session => {
                        const sRef = doc(sessionRepository.getCollectionRef(idTenant, idBranch), session.id)

                        // Se a data da sessão for maior que a nova data fim da turma, deletar (soft delete)
                        const newEndDate = data.endDate || oldData.endDate
                        if (newEndDate && session.sessionDate > newEndDate) {
                            mainBatch.update(sRef, {
                                deletedAt: serverTimestamp(),
                                deletedBy: userId,
                                isActive: false,
                                status: 'deleted',
                                updatedBy: userId,
                                updatedAt: serverTimestamp()
                            })
                        } else {
                            // Caso contrário, atualizar campos
                            mainBatch.update(sRef, {
                                ...changedFields,
                                updatedBy: userId,
                                updatedAt: serverTimestamp()
                            })
                        }
                    })
                }
            }
        } catch (error) {
            console.error("[ClassService] Erro na preparação do batch de propagação:", error)
        }

        // 3. Execução Atômica
        await mainBatch.commit()

        await AuditService.logUpdate({
            idTenant, idBranch, userId, userName,
            entityType: 'class', entityId: id,
            oldData, newData: data,
            description: `Atualização atômica da turma ${id} e sessões propagadas.`
        })

        return { id, ...updateData }
    },

    /**
     * Exclui uma turma (Soft Delete) e todas as suas sessões futuras
     * @param {string} fromDate - Data a partir da qual as sessões serão excluídas (YYYY-MM-DD). Se não informado, exclui tudo.
     */
    deleteClass: async (idTenant, idBranch, user, id, fromDate = null) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const oldData = await classRepository.findById(idTenant, idBranch, id)
        if (!oldData) throw new Error("Turma não encontrada")

        const db = classRepository.db
        const mainBatch = writeBatch(db)
        const classRef = doc(classRepository.getCollectionRef(idTenant, idBranch), id)

        // 1. Soft delete da turma (no batch)
        mainBatch.update(classRef, {
            deletedAt: serverTimestamp(),
            deletedBy: userId,
            status: 'deleted',
            updatedBy: userId,
            updatedAt: serverTimestamp()
        })

        // 2. Buscar e excluir sessões futuras
        const sessionsCollectionRef = sessionRepository.getCollectionRef(idTenant, idBranch)

        let q;
        if (fromDate) {
            q = query(sessionsCollectionRef, where('idClass', '==', id), where('sessionDate', '>=', fromDate))
        } else {
            q = query(sessionsCollectionRef, where('idClass', '==', id))
        }

        const sessionsSnapshot = await getDocs(q)
        sessionsSnapshot.docs.forEach(docSnap => {
            mainBatch.update(docSnap.ref, {
                deletedAt: serverTimestamp(),
                deletedBy: userId,
                updatedBy: userId,
                updatedAt: serverTimestamp()
            })
        })

        // 3. Commit Único (Atômico e barateia o processo)
        await mainBatch.commit()

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'GRADE_CLASS_DELETED',
            entityType: 'class',
            entityId: id,
            description: fromDate
                ? `Turma ${id} excluída a partir de ${fromDate}. ${sessionsSnapshot.size} sessões excluídas.`
                : `Turma ${id} excluída completamente.${sessionsSnapshot.size} sessões excluídas.`,
            details: { classItem: oldData, fromDate, deletedSessionsCount: sessionsSnapshot.size }
        })

        return { id, deletedSessionsCount: sessionsSnapshot.size }
    },



    /**
     * @deprecated Use AttendanceService.recordAttendance() instead
     * Salva o registro de presença de uma sessão
     */
    saveAttendance: async (idTenant, idBranch, user, idSession, attendanceData) => {
        // Delegar para o novo AttendanceService
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
