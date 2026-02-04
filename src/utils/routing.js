/**
 * Utilitários para gerenciamento de rotas
 */

/**
 * Constrói o caminho completo da rota com tenant e branch
 */
export const buildRoutePath = (path, tenantSlug, branchSlug) => {
    if (!tenantSlug || !branchSlug) return path
    
    // Remove barra inicial se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    
    return `/${tenantSlug}/${branchSlug}/${cleanPath}`
}

/**
 * Extrai parâmetros da URL
 */
export const extractRouteParams = (pathname) => {
    const parts = pathname.split('/').filter(Boolean)
    
    if (parts.length >= 2) {
        return {
            tenantSlug: parts[0],
            branchSlug: parts[1],
            path: '/' + parts.slice(2).join('/')
        }
    }
    
    return {
        tenantSlug: null,
        branchSlug: null,
        path: pathname
    }
}

/**
 * Verifica se a rota atual corresponde ao path
 */
export const isActiveRoute = (currentPath, routePath) => {
    // Remove tenant/branch do path atual
    const { path } = extractRouteParams(currentPath)
    
    // Exact match
    if (path === routePath) return true
    
    // Parent match (para submenus)
    if (path.startsWith(routePath + '/')) return true
    
    return false
}

/**
 * Encontra a rota correspondente ao path atual
 */
export const findRouteByPath = (routes, pathname) => {
    const { path } = extractRouteParams(pathname)
    
    for (const route of routes) {
        if (route.path === path) {
            return route
        }
        
        if (route.children) {
            const found = findRouteByPath(route.children, pathname)
            if (found) return found
        }
    }
    
    return null
}

/**
 * Gera breadcrumbs a partir da rota atual
 */
export const generateBreadcrumbs = (routes, pathname) => {
    const breadcrumbs = []
    const { path } = extractRouteParams(pathname)
    const pathParts = path.split('/').filter(Boolean)
    
    let currentPath = ''
    
    for (const part of pathParts) {
        currentPath += '/' + part
        const route = findRouteByPath(routes, currentPath)
        
        if (route && route.meta?.breadcrumb) {
            breadcrumbs.push({
                title: route.meta.breadcrumb,
                path: currentPath,
                icon: route.meta.icon
            })
        }
    }
    
    return breadcrumbs
}

/**
 * Ordena rotas por menuOrder
 */
export const sortRoutesByOrder = (routes) => {
    return [...routes].sort((a, b) => {
        const orderA = a.meta?.menuOrder || 999
        const orderB = b.meta?.menuOrder || 999
        return orderA - orderB
    })
}

/**
 * Filtra rotas que devem aparecer no menu
 */
export const getVisibleMenuRoutes = (routes) => {
    return routes.filter(route => route.meta?.showInMenu)
}

/**
 * Agrupa rotas por categoria
 */
export const groupRoutesByCategory = (routes) => {
    const grouped = {}
    
    routes.forEach(route => {
        const category = route.meta?.category || 'OUTROS'
        
        if (!grouped[category]) {
            grouped[category] = []
        }
        
        grouped[category].push(route)
    })
    
    // Ordena rotas dentro de cada categoria
    Object.keys(grouped).forEach(category => {
        grouped[category] = sortRoutesByOrder(grouped[category])
    })
    
    return grouped
}

/**
 * Valida se uma rota requer permissões
 */
export const routeRequiresPermission = (route) => {
    return !!(route.permission || (route.permissions && route.permissions.length > 0))
}

/**
 * Retorna todas as permissões necessárias de uma rota
 */
export const getRoutePermissions = (route) => {
    const permissions = []
    
    if (route.permission) {
        permissions.push(route.permission)
    }
    
    if (route.permissions && Array.isArray(route.permissions)) {
        permissions.push(...route.permissions)
    }
    
    return [...new Set(permissions)] // Remove duplicatas
}
