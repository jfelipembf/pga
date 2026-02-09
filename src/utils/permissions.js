/**
 * Utilitários para controle de acesso baseado em permissões
 */

/**
 * Verifica se o usuário tem uma permissão específica
 */
export const hasPermission = (userPermissions, requiredPermission) => {
    if (!userPermissions || typeof userPermissions !== 'object') {
        return false
    }
    return !!userPermissions[requiredPermission]
}

/**
 * Verifica se o usuário tem TODAS as permissões necessárias
 */
export const hasAllPermissions = (userPermissions, requiredPermissions = []) => {
    if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
        return true
    }
    return requiredPermissions.every(permission => hasPermission(userPermissions, permission))
}

/**
 * Verifica se o usuário tem ALGUMA das permissões necessárias
 */
export const hasAnyPermission = (userPermissions, requiredPermissions = []) => {
    if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
        return true
    }
    return requiredPermissions.some(permission => hasPermission(userPermissions, permission))
}

/**
 * Filtra rotas baseado nas permissões do usuário
 */
export const filterRoutesByPermissions = (routes, userPermissions) => {
    return routes.filter(route => {
        // Se a rota não requer permissão, sempre mostrar
        if (!route.permission && !route.permissions) {
            return true
        }

        // Se requer uma única permissão
        if (route.permission) {
            return hasPermission(userPermissions, route.permission)
        }

        // Se requer múltiplas permissões (todas)
        if (route.permissions && route.requireAll) {
            return hasAllPermissions(userPermissions, route.permissions)
        }

        // Se requer múltiplas permissões (qualquer uma)
        if (route.permissions) {
            return hasAnyPermission(userPermissions, route.permissions)
        }

        return false
    })
}

/**
 * Filtra itens de menu baseado nas permissões do usuário
 */
export const filterMenuByPermissions = (menuItems, userPermissions) => {
    // Se for owner/admin total, retorna tudo sem filtrar (acesso irrestrito)
    if (userPermissions && userPermissions.all === true) {
        return menuItems;
    }

    return menuItems
        .map(item => {
            // Se tem subitens, filtra recursivamente
            if (item.subItems && item.subItems.length > 0) {
                const filteredSubItems = filterMenuByPermissions(item.subItems, userPermissions)

                // Se não sobrou nenhum subitem, não mostra o item pai
                if (filteredSubItems.length === 0) {
                    return null
                }

                return {
                    ...item,
                    subItems: filteredSubItems
                }
            }

            // Se não requer permissão, sempre mostrar
            if (!item.permission && !item.permissions) {
                return item
            }

            // Verifica permissão
            if (item.permission && hasPermission(userPermissions, item.permission)) {
                return item
            }

            if (item.permissions && hasAnyPermission(userPermissions, item.permissions)) {
                return item
            }

            return null
        })
        .filter(item => item !== null)
}

/**
 * Pega as permissões do staff do localStorage
 */
export const getStaffPermissions = () => {
    try {
        const authUser = localStorage.getItem("authUser")
        if (!authUser) return {}

        const user = JSON.parse(authUser)

        // Se for proprietário/owner, tem todas as permissões
        if (user.role === 'owner' || user.role === 'proprietario') {
            return { all: true }
        }

        // Retorna as permissões do cargo do usuário
        return user.permissions || {}
    } catch (error) {
        console.error("Erro ao obter permissões:", error)
        return {}
    }
}

/**
 * Verifica se o usuário é proprietário/owner (acesso total)
 */
export const isOwner = () => {
    try {
        const authUser = localStorage.getItem("authUser")
        if (!authUser) return false

        const user = JSON.parse(authUser)
        return user.role === 'owner' || user.role === 'proprietario'
    } catch (error) {
        return false
    }
}
