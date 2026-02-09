import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Componente Enterprise para proteger rotas baseado em permissões
 * 
 * Uso direto:
 * <ProtectedRoute permission="admin_activities">
 *   <ActivitiesPage />
 * </ProtectedRoute>
 * 
 * Ou com configuração de rota:
 * <ProtectedRoute route={routeConfig}>
 *   <Component />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({
    children,
    route = null,
    permission = null,
    permissions = null,
    requireAll = false,
    auth = true,
    redirectTo = "/dashboard",
    fallback = null
}) => {
    const { isAuthenticated, isOwner, hasPermission, hasAnyPermission } = useAuth()

    // Se recebeu route config, extrai as props
    if (route) {
        permission = route.permission || permission
        permissions = route.permissions || permissions
        requireAll = route.requireAll || requireAll
        auth = route.auth !== undefined ? route.auth : auth
    }

    // 1. Verifica autenticação
    if (auth && !isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // 2. Proprietário tem acesso a tudo
    if (isOwner) {
        return children
    }

    // 3. Verifica permissões

    // Permissão única
    if (permission && !hasPermission(permission)) {
        return fallback || <Navigate to={redirectTo} replace />
    }

    // Múltiplas permissões
    if (permissions && permissions.length > 0) {
        const hasAccess = requireAll
            ? permissions.every(p => hasPermission(p))
            : hasAnyPermission(permissions)

        if (!hasAccess) {
            return fallback || <Navigate to={redirectTo} replace />
        }
    }

    return children
}

/**
 * HOC para proteger componentes
 */
export const withPermission = (Component, permission) => {
    return (props) => (
        <ProtectedRoute permission={permission}>
            <Component {...props} />
        </ProtectedRoute>
    )
}

/**
 * HOC para proteger com configuração de rota
 */
export const withRouteConfig = (Component, routeConfig) => {
    return (props) => (
        <ProtectedRoute route={routeConfig}>
            <Component {...props} />
        </ProtectedRoute>
    )
}
