import { RoleService } from '../Admin/RoleService'

export const ensureDefaultRoles = async (idTenant, idBranch) => {
    return await RoleService.listAll(idTenant, idBranch)
}

export const createRole = async (idTenant, idBranch, userId, roleData) => {
    return await RoleService.createRole(idTenant, idBranch, userId, roleData)
}

export const updateRole = async (idTenant, idBranch, userId, roleId, roleData) => {
    return await RoleService.updateRole(idTenant, idBranch, userId, roleId, roleData)
}

export const deleteRole = async (idTenant, idBranch, userId, roleId) => {
    return await RoleService.deleteRole(idTenant, idBranch, userId, roleId)
}

export const listRoles = async (idTenant, idBranch) => {
    return await RoleService.listAll(idTenant, idBranch)
}
