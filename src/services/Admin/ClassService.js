import { classRepository } from '../../data/repositories/ClassRepository'
import { AuditService } from '../Audit/AuditService'
import { ClassSchema } from '../../data/schemas/Admin/ClassSchema'

/**
 * Serviço para Gestão de Turmas (Classes)
 */
export const ClassService = {
    /**
     * Cria uma nova turma
     */
    createClass: async (idTenant, idBranch, userId, classData) => {
        await ClassSchema.validate(classData, { abortEarly: false })

        const newClass = await classRepository.create(idTenant, idBranch, {
            ...classData,
            isActive: classData.isActive !== false,
            status: classData.status || 'active',
            enrolledCount: classData.enrolledCount || 0,
            schedule: classData.schedule || [],
            createdBy: userId,
            createdAt: new Date(),
            deletedAt: null
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: classData.userName,
            action: 'CLASS_CREATED',
            entityType: 'class',
            entityId: newClass.id,
            description: `Nova turma criada: ${classData.name}`
        })

        return newClass
    },

    /**
     * Lista todas as turmas
     */
    listAll: async (idTenant, idBranch) => {
        const data = await classRepository.findAll(idTenant, idBranch)
        return data.filter(c => !c.deletedAt)
    },

    /**
     * Lista turmas com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}) => {
        const allClasses = await classRepository.findAll(idTenant, idBranch)
        return allClasses.filter(c => !c.deletedAt)
    },

    /**
     * Busca turma por ID
     */
    findById: async (idTenant, idBranch, id) => {
        return await classRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Atualiza uma turma
     */
    updateClass: async (idTenant, idBranch, userId, id, data) => {
        const result = await classRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: new Date()
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: data.userName,
            action: 'CLASS_UPDATED',
            entityType: 'class',
            entityId: id,
            description: `Turma atualizada: ${data.name || id}`
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteClass: async (idTenant, idBranch, userId, id, userName) => {
        const classItem = await classRepository.findById(idTenant, idBranch, id)
        if (!classItem) throw new Error("Turma não encontrada")
        if (classItem.deletedAt) throw new Error("Turma já foi excluída")

        const result = await classRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: userName,
            action: 'CLASS_DELETED',
            entityType: 'class',
            entityId: id,
            description: `Turma excluída: ${classItem.name || id}`
        })

        return result
    }
}
