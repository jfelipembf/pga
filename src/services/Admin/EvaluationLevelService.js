import { evaluationLevelRepository } from '../../data/repositories/EvaluationLevelRepository'
import { AuditService } from '../Core/AuditService'
import { EvaluationLevelSchema } from '../../data/schemas/Admin/EvaluationLevelSchema'
import { normalizeDate } from '../../utils/date'

/**
 * Serviço para Gestão de Níveis de Avaliação
 */
export const EvaluationLevelService = {
    /**
     * Cria um novo nível de avaliação
     */
    createLevel: async (idTenant, idBranch, userId, levelData) => {
        await EvaluationLevelSchema.validate(levelData, { abortEarly: false })

        const newLevel = await evaluationLevelRepository.create(idTenant, idBranch, {
            ...levelData,
            isActive: levelData.isActive !== false,
            status: levelData.status || 'active',
            createdBy: userId,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
            deletedAt: null
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: levelData.userName,
            action: 'EVALUATION_LEVEL_CREATED',
            entityType: 'evaluationLevel',
            entityId: newLevel.id,
            description: `Novo nível de avaliação criado: ${levelData.title} (valor: ${levelData.value})`
        })

        return newLevel
    },

    /**
     * Lista todos os níveis de avaliação ordenados
     */
    listAll: async (idTenant, idBranch) => {
        return await evaluationLevelRepository.findAllOrdered(idTenant, idBranch)
    },

    /**
     * Lista níveis com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}, limitCount = 100) => {
        const allLevels = await evaluationLevelRepository.findAllOrdered(idTenant, idBranch)

        let levels = allLevels.filter(level => !level.deletedAt)

        // Filtro por ativo/inativo
        if (filters.isActive !== undefined) {
            levels = levels.filter(level => level.isActive === filters.isActive)
        }

        return levels.slice(0, limitCount)
    },

    /**
     * Busca nível por ID
     */
    findById: async (idTenant, idBranch, id) => {
        return await evaluationLevelRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Atualiza um nível de avaliação
     */
    updateLevel: async (idTenant, idBranch, userId, id, data) => {
        // 1. Snapshot
        const oldData = await evaluationLevelRepository.findById(idTenant, idBranch, id)

        const result = await evaluationLevelRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: normalizeDate(new Date())
        })

        await AuditService.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityType: 'evaluationLevel',
            entityId: id,
            oldData,
            newData: data,
            description: `Nível de avaliação atualizado: ${data.title || id}`
        })

        return result
    },

    /**
     * Reordena níveis de avaliação
     */
    reorderLevels: async (idTenant, idBranch, userId, orderedIds, userName) => {
        await evaluationLevelRepository.updateOrder(idTenant, idBranch, orderedIds)

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: userName,
            action: 'EVALUATION_LEVELS_REORDERED',
            entityType: 'evaluationLevel',
            entityId: 'bulk',
            description: `Ordem dos níveis de avaliação atualizada`
        })

        return { success: true }
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteLevel: async (idTenant, idBranch, userId, id, userName) => {
        const level = await evaluationLevelRepository.findById(idTenant, idBranch, id)
        if (!level) throw new Error("Nível de avaliação não encontrado")
        if (level.deletedAt) throw new Error("Nível de avaliação já foi excluído")

        const result = await evaluationLevelRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: userName,
            action: 'EVALUATION_LEVEL_DELETED',
            entityType: 'evaluationLevel',
            entityId: id,
            description: `Nível de avaliação excluído: ${level.title || id}`,
            details: { snapshot: level }
        })

        return result
    }
}
