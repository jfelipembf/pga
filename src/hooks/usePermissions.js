import { useAuth } from './useAuth'

/**
 * @deprecated Use useAuth() ao invés disso.
 * 
 * Este hook é mantido para compatibilidade com código legado.
 * Internamente usa useAuth() que é a fonte de verdade.
 * 
 * Migração:
 * - Antes: const { filteredMenu, hasPermission } = usePermissions()
 * - Depois: const { filteredMenu, hasPermission } = useAuth()
 */
export const usePermissions = () => {
    const {
        permissions,
        isOwner,
        hasPermission,
        hasAnyPermission,
        filteredMenu
    } = useAuth()

    return {
        permissions,
        isOwner,
        hasPermission,
        hasAnyPermission,
        canAccess: (routeConfig) => {
            if (!routeConfig) return true
            const { permission, permissions: perms } = routeConfig
            if (permission) return hasPermission(permission)
            if (perms) return hasAnyPermission(perms)
            return true
        },
        filteredMenu,
    }
}

export default usePermissions
