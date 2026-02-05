import moment from 'moment'
import { classRepository } from '../../data/repositories/ClassRepository'
import { sessionRepository } from '../../data/repositories/SessionRepository'
import { CreateGradeSchema, ClassSchema, SessionSchema } from '../../data/schemas/Classes/ClassSchema'
import { AuditService } from '../Audit/AuditService'
import { timeToMinutes } from '../../utils/sharedUtils'
import { query, where, getDocs, writeBatch, increment } from 'firebase/firestore'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'

/**
 * Serviço para Gestão de Turmas e Sessões
 */
export const ClassService = {
    /**
     * Cria uma nova grade de aulas. 
     */
    createGrade: async (idTenant, idBranch, user, formData) => {
        // 1. Validar entrada
        await CreateGradeSchema.validate(formData, { abortEarly: false })

        const {
            idActivity,
            idArea,
            idStaff,
            weekdays,
            startTime,
            endTime,
            startDate,
            endDate,
            maxCapacity,
            isActive
        } = formData

        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'
        const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime)
        const createdClasses = []

        // 2. Loop por cada dia da semana selecionado
        for (const weekday of weekdays) {
            const classData = {
                idActivity,
                idArea,
                idStaff,
                weekday,
                startTime,
                endTime,
                durationMinutes,
                maxCapacity,
                isActive: isActive !== false,
                status: 'active'
            }

            // Validar dados da turma individual
            await ClassSchema.validate(classData)

            // 3. Criar documento da Turma (Class)
            const newClass = await classRepository.create(idTenant, idBranch, {
                ...classData,
                createdBy: userId,
                updatedBy: userId
            })

            // 4. Gerar Sessões Recorrentes
            const sessions = []
            let current = moment(startDate).startOf('day')

            // Se não houver data de fim, gera para os próximos 6 meses
            const endLimit = endDate
                ? moment(endDate).endOf('day')
                : moment(startDate).add(6, 'months').endOf('day')

            // Ajusta o início para o primeiro dia da semana correspondente
            while (current.day() !== weekday && current.isBefore(endLimit)) {
                current.add(1, 'day')
            }

            while (current.isSameOrBefore(endLimit)) {
                const sessionDate = current.format('YYYY-MM-DD')
                const sessionId = `${newClass.id}-${sessionDate}`

                const sessionData = {
                    id: sessionId,
                    idSession: sessionId,
                    idClass: newClass.id,
                    idActivity,
                    idArea,
                    idStaff,
                    sessionDate,
                    startTime,
                    endTime,
                    durationMinutes,
                    weekday,
                    maxCapacity,
                    enrolledCount: 0,
                    presentCount: 0,
                    absentCount: 0,
                    attendanceRecorded: false,
                    status: 'scheduled',
                    isActive: isActive !== false
                }

                // Validar sessão
                await SessionSchema.validate(sessionData)

                // Usar 'set' para garantir o ID customizado
                await sessionRepository.set(idTenant, idBranch, sessionId, {
                    ...sessionData,
                    createdBy: userId,
                    updatedBy: userId
                })

                sessions.push(sessionId)
                current.add(7, 'days')
            }

            createdClasses.push({
                ...newClass,
                sessionsCount: sessions.length
            })

            // 5. Auditoria da Turma com Detalhes
            const periodInfo = endDate
                ? `até ${moment(endDate).format('DD/MM/YYYY')}`
                : '(6 meses automáticos)'

            await AuditService.log({
                idTenant, idBranch, userId, userName,
                action: 'GRADE_CLASS_CREATED',
                entityType: 'class',
                entityId: newClass.id,
                description: `Turma criada - Atividade: ${idActivity}, Dia: ${weekday}, Início: ${startTime}, Sessões: ${sessions.length} ${periodInfo}`,
                details: {
                    classData,
                    sessionsCount: sessions.length,
                    startDate,
                    endDate: endDate || `${moment(startDate).add(6, 'months').format('YYYY-MM-DD')} (auto)`,
                    autoGenerated: !endDate
                }
            })
        }

        return createdClasses
    },

    /**
     * Lista todas as turmas da grade
     */
    listClasses: async (idTenant, idBranch) => {
        return await classRepository.findActive(idTenant, idBranch)
    },

    /**
     * Lista sessões por intervalo
     */
    listSessions: async (idTenant, idBranch, start, end) => {
        return await sessionRepository.findByDateRange(idTenant, idBranch, start, end)
    },

    /**
     * Lista os alunos matriculados na turma dessa sessão
     */
    getStudentsForClass: async (idTenant, idBranch, idClass) => {
        return await enrollmentRepository.findByClass(idTenant, idBranch, idClass)
    },

    /**
     * Lista as turmas com filtros (Versão simplificada para compatibilidade legado)
     */
    listWithFilters: async (idTenant, idBranch, filters = {}) => {
        const classes = await classRepository.findActive(idTenant, idBranch)
        // Aplicar filtros simples se necessário
        return classes
    },

    /**
     * Lista todas as sessões ativas (Versão simplificada para compatibilidade legado)
     */
    listAll: async (idTenant, idBranch) => {
        return await sessionRepository.findActive(idTenant, idBranch)
    },

    /**
     * Atualiza uma turma existente
     */
    updateClass: async (idTenant, idBranch, user, id, data) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const updateData = {
            ...data,
            updatedBy: userId
        }

        const result = await classRepository.update(idTenant, idBranch, id, updateData)

        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'GRADE_CLASS_UPDATED',
            entityType: 'class',
            entityId: id,
            description: `Turma ${id} atualizada.`,
            details: { updateData }
        })

        return result
    },

    /**
     * Exclui uma turma (Soft Delete) e todas as suas sessões futuras
     * @param {string} fromDate - Data a partir da qual as sessões serão excluídas (YYYY-MM-DD). Se não informado, exclui tudo.
     */
    deleteClass: async (idTenant, idBranch, user, id, fromDate = null) => {
        const userId = user.uid
        const userName = user.displayName || user.email || 'Sistema'

        const classItem = await classRepository.findById(idTenant, idBranch, id)
        if (!classItem) throw new Error("Turma não encontrada")

        // 1. Soft delete da turma
        await classRepository.softDelete(idTenant, idBranch, id, userId)

        // 2. Buscar e excluir sessões futuras
        let deletedSessionsCount = 0

        if (fromDate) {
            // Excluir apenas sessões a partir da data especificada
            const db = sessionRepository.db

            const sessionsCollectionRef = sessionRepository.getCollectionRef(idTenant, idBranch)

            const q = query(
                sessionsCollectionRef,
                where('idClass', '==', id),
                where('sessionDate', '>=', fromDate)
            )

            const sessionsSnapshot = await getDocs(q)

            const batch = writeBatch(db)
            sessionsSnapshot.docs.forEach(docSnap => {
                batch.update(docSnap.ref, {
                    deletedAt: new Date(),
                    deletedBy: userId,
                    updatedBy: userId,
                    updatedAt: new Date()
                })
            })

            if (sessionsSnapshot.size > 0) {
                await batch.commit()
                deletedSessionsCount = sessionsSnapshot.size
            }
        } else {
            // Excluir TODAS as sessões da turma
            const db = sessionRepository.db

            const sessionsCollectionRef = sessionRepository.getCollectionRef(idTenant, idBranch)

            const q = query(
                sessionsCollectionRef,
                where('idClass', '==', id)
            )

            const sessionsSnapshot = await getDocs(q)

            const batch = writeBatch(db)
            sessionsSnapshot.docs.forEach(docSnap => {
                batch.update(docSnap.ref, {
                    deletedAt: new Date(),
                    deletedBy: userId,
                    updatedBy: userId,
                    updatedAt: new Date()
                })
            })

            if (sessionsSnapshot.size > 0) {
                await batch.commit()
                deletedSessionsCount = sessionsSnapshot.size
            }
        }

        // 3. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId, userName,
            action: 'GRADE_CLASS_DELETED',
            entityType: 'class',
            entityId: id,
            description: fromDate
                ? `Turma ${id} excluída a partir de ${fromDate}. ${deletedSessionsCount} sessões futuras excluídas.`
                : `Turma ${id} excluída completamente. ${deletedSessionsCount} sessões excluídas.`,
            details: {
                classItem,
                fromDate,
                deletedSessionsCount
            }
        })

        return { id, deletedSessionsCount }
    },



    /**
     * @deprecated Use AttendanceService.recordAttendance() instead
     * Salva o registro de presença de uma sessão
     */
    saveAttendance: async (idTenant, idBranch, user, idSession, attendanceData) => {
        // Delegar para o novo AttendanceService
        const { AttendanceService } = await import('./AttendanceService')
        return AttendanceService.recordAttendance(idTenant, idBranch, user, idSession, attendanceData)
    }
}
