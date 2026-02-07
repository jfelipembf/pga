import React from "react";
import { Navigate, useParams, Outlet } from "react-router-dom";
import { hasPermission, hasAnyPermission, isOwner } from "../../utils/permissions";

const Authmiddleware = (props) => {
  const { idTenant, idBranch } = useParams();
  const authUser = localStorage.getItem("authUser");

  if (!authUser) {
    console.log("[Auth] Usuário não encontrado, redirecionando para login");
    const loginPath = idTenant && idBranch ? `/${idTenant}/${idBranch}/login` : "/login";
    return (
      <Navigate to={loginPath} />
    );
  }

  // const userIsOwner = isOwner();
  // console.log(`[Auth] Role: ${userIsOwner ? 'Owner' : 'Colaborador'}`);

  // RBAC Check
  const { permission } = props;
  if (permission && !isOwner()) {
    try {
      const user = JSON.parse(authUser);
      const userPermissions = user.permissions || {};

      const hasAccess = Array.isArray(permission)
        ? hasAnyPermission(userPermissions, permission)
        : hasPermission(userPermissions, permission);

      if (!hasAccess) {
        // Redireciona para 403 (Acesso Negado) se não tiver permissão
        return <Navigate to={`/${idTenant}/${idBranch}/pages-403`} />;
      }
    } catch (e) {
      console.error("Erro ao validar permissões na rota", e);
    }
  }

  // If used as a wrapper:
  if (props.children) {
    return <React.Fragment>{props.children}</React.Fragment>;
  }

  // If used as a layout route:
  return <Outlet />;
};

export default Authmiddleware;
