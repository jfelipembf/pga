/**
 * PERMISSION UTILITIES
 * 
 * Funções utilitárias para verificação de permissões no frontend.
 * Usadas tanto pelo middleware de rotas quanto pelo filtro de menu.
 */

/**
 * Verifica se o usuário é owner (acesso total)
 */
export const isOwner = (userPermissions) => {
    return userPermissions?.all === true
}

/**
 * Verifica se o usuário tem uma permissão específica
 */
export const hasPermission = (userPermissions, permissionId) => {
    if (!permissionId) return true // Sem permissão definida = público
    if (isOwner(userPermissions)) return true
    return userPermissions?.[permissionId] === true
}

/**
 * Verifica se o usuário tem QUALQUER UMA das permissões
 */
export const hasAnyPermission = (userPermissions, permissionIds) => {
    if (!permissionIds || permissionIds.length === 0) return true
    if (isOwner(userPermissions)) return true
    return permissionIds.some(id => userPermissions?.[id] === true)
}

/**
 * Verifica se o usuário tem TODAS as permissões
 */
export const hasAllPermissions = (userPermissions, permissionIds) => {
    if (!permissionIds || permissionIds.length === 0) return true
    if (isOwner(userPermissions)) return true
    return permissionIds.every(id => userPermissions?.[id] === true)
}

/**
 * Filtra itens do menu com base nas permissões do usuário
 */
export const filterMenuByPermissions = (menuItems, userPermissions) => {
    if (isOwner(userPermissions)) return menuItems

    return menuItems
        .map(item => {
            // Headers passam direto
            if (item.isHeader) return item

            // Item com subitems
            if (item.subItems && item.subItems.length > 0) {
                const filteredSubItems = item.subItems.filter(subItem => {
                    // Verifica permissão única ou array de permissões
                    if (subItem.permission) {
                        return hasPermission(userPermissions, subItem.permission)
                    }
                    if (subItem.permissions) {
                        return hasAnyPermission(userPermissions, subItem.permissions)
                    }
                    return true // Sem permissão = público
                })

                // Se após filtro não sobrar subitems, não mostra o item pai
                if (filteredSubItems.length === 0) return null

                return { ...item, subItems: filteredSubItems }
            }

            // Item simples
            if (item.permission) {
                return hasPermission(userPermissions, item.permission) ? item : null
            }
            if (item.permissions) {
                return hasAnyPermission(userPermissions, item.permissions) ? item : null
            }

            return item // Sem permissão = público
        })
        .filter(Boolean) // Remove nulls
}

/**
 * Verifica se o usuário tem acesso a uma rota específica
 * @param {Object} userPermissions - Permissões do usuário
 * @param {Object} routeConfig - Configuração da rota { permission?, permissions? }
 */
export const canAccessRoute = (userPermissions, routeConfig) => {
    if (!routeConfig) return true

    const { permission, permissions } = routeConfig

    if (permission) {
        return hasPermission(userPermissions, permission)
    }

    if (permissions) {
        return hasAnyPermission(userPermissions, permissions)
    }

    return true // Sem restrição
}
