import { roleRepository } from '../../data/repositories/RoleRepository'
import { AuditService } from '../Core/AuditService'
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

        const newRole = await roleRepository.create(idTenant, idBranch, {
            ...roleData,
            status: roleData.status || 'active',
            permissions: roleData.permissions || {},
            createdBy: userId,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
            deletedAt: null
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: roleData.userName,
            action: 'ROLE_CREATED',
            entityType: 'role',
            entityId: newRole.id,
            description: `Nova função criada: ${roleData.name || roleData.label || 'Sem nome'}`
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
        // 1. Snapshot Anterior
        const oldData = await roleRepository.findById(idTenant, idBranch, id)

        // 2. Persistir
        const result = await roleRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: normalizeDate(new Date())
        })

        // 3. Auditoria com Diff
        await AuditService.logUpdate({
            idTenant,
            idBranch,
            userId,
            userName: data.userName,
            entityType: 'role',
            entityId: id,
            oldData,
            newData: data,
            description: `Atualizou a função ${oldData?.name || id}`
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteRole: async (idTenant, idBranch, userId, id, userName) => {
        const role = await roleRepository.findById(idTenant, idBranch, id)
        if (!role) throw new Error("Função não encontrada")
        if (role.deletedAt) throw new Error("Função já foi excluída")

        const result = await roleRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: userName,
            action: 'ROLE_DELETED',
            entityType: 'role',
            entityId: id,
            description: `Função excluída: ${role.name || role.label || id}`
        })

        return result
    }
}
