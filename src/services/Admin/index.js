/**
 * Admin Services - Cadastros administrativos
 * 
 * Estrutura:
 * - ActivityService: Atividades/Modalidades
 * - AreaService: Áreas/Espaços
 * - CatalogService: Catálogo de produtos
 * - EvaluationLevelService: Níveis de avaliação
 * - RoleService: Cargos/Perfis de acesso
 * - StaffService: Colaboradores
 */

export { ActivityService } from './ActivityService'
export { AreaService } from './AreaService'
export { CatalogService } from './CatalogService'
export { EvaluationLevelService } from './EvaluationLevelService'
export { RoleService } from './RoleService'
export { StaffService } from './StaffService'

// ===============================================
// WRAPPER LEGADO - Manter para compatibilidade
// ===============================================

// Activity
export const listActivities = async (idTenant, idBranch) => {
    const { ActivityService } = await import('./ActivityService')
    return await ActivityService.listAll(idTenant, idBranch)
}

export const listActivitiesWithObjectives = async (idTenant, idBranch) => {
    const { ActivityService } = await import('./ActivityService')
    return await ActivityService.listAll(idTenant, idBranch)
}

// Areas
export const listAreas = async (idTenant, idBranch) => {
    const { AreaService } = await import('./AreaService')
    return await AreaService.listAreas(idTenant, idBranch)
}

// Roles
export const listRoles = async (idTenant, idBranch) => {
    const { RoleService } = await import('./RoleService')
    return await RoleService.listAll(idTenant, idBranch)
}

// Staff
export const listStaff = async (idTenant, idBranch, filters = {}) => {
    const { StaffService } = await import('./StaffService')
    return await StaffService.listWithFilters(idTenant, idBranch, filters)
}
