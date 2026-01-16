import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { hasAnyPermission } from "../../helpers/permission_helper";

/**
 * Componente que protege rotas baseado em permissões (RBAC)
 */
const ProtectedRoute = ({ children, permissions }) => {
    const { tenant, branch } = useParams();

    // Se não forem passadas permissões, a rota é pública (para usuários logados)
    if (!permissions || permissions.length === 0) {
        return children;
    }

    const isAuthorized = hasAnyPermission(permissions);

    if (!isAuthorized) {
        // Redireciona para página de acesso negado
        // Tenta manter o contexto de tenant/branch se disponível
        const target = tenant && branch ? `/${tenant}/${branch}/pages-403` : "/pages-403";

        return <Navigate to={target} replace />;
    }

    return children;
};

export default ProtectedRoute;
