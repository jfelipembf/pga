import { staffRepository } from '../../data/repositories/StaffRepository'
import { AuditService } from '../Audit/AuditService'
import { StaffSchema } from '../../data/schemas/Admin/StaffSchema'

/**
 * Serviço para Gestão de Colaboradores (Staff)
 */
export const StaffService = {
    /**
     * Cria um novo colaborador
     */
    createStaff: async (idTenant, idBranch, userId, staffData) => {
        await StaffSchema.validate(staffData, { abortEarly: false })

        const newStaff = await staffRepository.create(idTenant, idBranch, {
            ...staffData,
            isActive: staffData.isActive !== false,
            status: staffData.status || 'active',
            createdBy: userId,
            createdAt: new Date(),
            deletedAt: null
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: staffData.userName,
            action: 'STAFF_CREATED',
            entityType: 'staff',
            entityId: newStaff.id,
            description: `Novo colaborador criado: ${staffData.name}`
        })

        return newStaff
    },

    /**
     * Lista todos os colaboradores
     */
    listAll: async (idTenant, idBranch) => {
        const data = await staffRepository.findAll(idTenant, idBranch)
        return data.filter(s => !s.deletedAt)
    },

    /**
     * Lista colaboradores com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}) => {
        const whereClauses = []

        if (filters.status && filters.status !== 'all') {
            whereClauses.push(['status', '==', filters.status])
        }

        if (filters.isActive !== undefined) {
            whereClauses.push(['isActive', '==', filters.isActive])
        }

        if (filters.roleId) {
            whereClauses.push(['roleId', '==', filters.roleId])
        }

        if (filters.areaId) {
            whereClauses.push(['areaId', '==', filters.areaId])
        }

        const rawData = await staffRepository.findWhere(
            idTenant, 
            idBranch,
            whereClauses,
            { field: 'name', direction: 'asc' }
        )

        return rawData.filter(s => !s.deletedAt)
    },

    /**
     * Busca colaborador por ID
     */
    findById: async (idTenant, idBranch, id) => {
        return await staffRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Atualiza um colaborador
     */
    updateStaff: async (idTenant, idBranch, userId, id, data) => {
        const result = await staffRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: new Date()
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: data.userName,
            action: 'STAFF_UPDATED',
            entityType: 'staff',
            entityId: id,
            description: `Colaborador atualizado: ${data.name || id}`
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteStaff: async (idTenant, idBranch, userId, id) => {
        const staff = await staffRepository.findById(idTenant, idBranch, id)
        if (!staff) throw new Error("Colaborador não encontrado")

        const result = await staffRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'STAFF_DELETED',
            entityType: 'staff',
            entityId: id,
            description: `Colaborador excluído: ${staff.name || id}`
        })

        return result
    }
}
