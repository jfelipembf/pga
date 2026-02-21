import { roleRepository } from '../../data/repositories/RoleRepository'
import { RoleAuditLogger } from './audit/RoleAuditLogger'
import { RoleRules } from './domain/RoleRules'
import { RoleSchema } from '../../data/schemas/Admin/RoleSchema'
import { normalizeDate } from '../../utils/date'

/**
 * Serviço para Gestão de Funções/Cargos (Roles)
 */
export const RoleService = {
    /**
     * Cria uma nova função
     */
    createRole: async (idTenant, idBranch, userId, roleData) => {
        await RoleSchema.validate(roleData, { abortEarly: false })

        const payload = RoleRules.buildCreationPayload(roleData, userId)

        const newRole = await roleRepository.create(idTenant, idBranch, {
            ...payload,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        })

        await RoleAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: roleData.userName,
            entityId: newRole.id,
            roleName: roleData.name || roleData.label
        })

        return newRole
    },

    /**
     * Lista todas as funções
     */
    listAll: async (idTenant, idBranch) => {
        const data = await roleRepository.findAll(idTenant, idBranch)
        return data.filter(r => !r.deletedAt)
    },

    /**
     * Lista funções com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}, limitCount = 100) => {
        const allRoles = await roleRepository.findAll(idTenant, idBranch)

        const roles = allRoles
            .filter(r => !r.deletedAt)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .slice(0, limitCount)

        return roles
    },

    /**
     * Busca função por ID
     */
    findById: async (idTenant, idBranch, id) => {
        return await roleRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Atualiza uma função
     */
    updateRole: async (idTenant, idBranch, userId, id, data) => {
        const oldData = await roleRepository.findById(idTenant, idBranch, id)

        const result = await roleRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: normalizeDate(new Date())
        })

        await RoleAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData,
            newData: data
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteRole: async (idTenant, idBranch, userId, id, userName) => {
        const role = await roleRepository.findById(idTenant, idBranch, id)
        RoleRules.validateForDeletion(role)

        const result = await roleRepository.softDelete(idTenant, idBranch, id, userId)

        await RoleAuditLogger.logDeletion({
            idTenant, idBranch, userId, userName,
            entityId: id,
            roleName: role.name || role.label
        })

        return result
    }
}
