import { PERMISSIONS } from '../pages/Admin/Roles/Constants/permissions'

/**
 * Utilitário para migração automática de permissões em cargos
 */

/**
 * Retorna todas as permissões disponíveis no sistema
 */
export const getAllPermissionIds = () => {
    return PERMISSIONS.map(p => p.id)
}

/**
 * Verifica se um cargo tem permissões faltantes
 */
export const hasMissingPermissions = (rolePermissions = {}) => {
    const allPermissions = getAllPermissionIds()
    const rolePermissionIds = Object.keys(rolePermissions)
    
    return allPermissions.some(permId => !rolePermissionIds.includes(permId))
}

/**
 * Adiciona permissões faltantes a um cargo mantendo as existentes
 * Novas permissões são adicionadas como FALSE por padrão
 */
export const addMissingPermissions = (rolePermissions = {}) => {
    const allPermissions = getAllPermissionIds()
    const updatedPermissions = { ...rolePermissions }
    
    allPermissions.forEach(permId => {
        if (!(permId in updatedPermissions)) {
            updatedPermissions[permId] = false
        }
    })
    
    return updatedPermissions
}

/**
 * Migra um cargo adicionando permissões faltantes
 */
export const migrateRole = (role) => {
    if (!role || !role.permissions) {
        return role
    }

    const needsMigration = hasMissingPermissions(role.permissions)
    
    if (!needsMigration) {
        return role
    }

    return {
        ...role,
        permissions: addMissingPermissions(role.permissions)
    }
}

/**
 * Migra uma lista de cargos
 */
export const migrateRoles = (roles = []) => {
    return roles.map(role => migrateRole(role))
}

/**
 * Retorna estatísticas de migração
 */
export const getMigrationStats = (roles = []) => {
    const allPermissions = getAllPermissionIds()
    let rolesNeedingMigration = 0
    let totalMissingPermissions = 0

    roles.forEach(role => {
        if (role.permissions) {
            const rolePermissionIds = Object.keys(role.permissions)
            const missing = allPermissions.filter(p => !rolePermissionIds.includes(p))
            
            if (missing.length > 0) {
                rolesNeedingMigration++
                totalMissingPermissions += missing.length
            }
        }
    })

    return {
        totalRoles: roles.length,
        rolesNeedingMigration,
        totalMissingPermissions,
        totalPermissions: allPermissions.length
    }
}
