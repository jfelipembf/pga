import React, { Suspense } from "react"
import { Navigate, useParams, Outlet } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

/**
 * Middleware de autenticação e autorização.
 * 
 * Responsabilidades:
 * 1. Verificar se usuário está autenticado
 * 2. Verificar se usuário tem permissão para acessar a rota
 * 3. Redirecionar para login ou página de erro conforme necessário
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Permissão(ões) requerida(s)
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado se autorizado
 */
const Authmiddleware = (props) => {
  const { idTenant, idBranch } = useParams()
  const { isAuthenticated, isOwner, hasPermission, hasAnyPermission, isLoading } = useAuth()

  // Loading state
  if (isLoading) {
    return (
      <div className="page-content">
        <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    )
  }

  // 1. Verificar autenticação
  if (!isAuthenticated) {

    const loginPath = idTenant && idBranch
      ? `/${idTenant}/${idBranch}/login`
      : "/login"
    return <Navigate to={loginPath} replace />
  }

  // 2. Verificar autorização (se permissão foi especificada)
  const { permission, permissions } = props

  // Owner tem acesso total
  if (!isOwner && (permission || permissions)) {
    let hasAccess = true

    if (permission) {
      hasAccess = Array.isArray(permission)
        ? hasAnyPermission(permission)
        : hasPermission(permission)
    } else if (permissions) {
      hasAccess = hasAnyPermission(permissions)
    }

    if (!hasAccess) {

      return <Navigate to={`/${idTenant}/${idBranch}/pages-403`} replace />
    }
  }

  // 3. Renderizar conteúdo
  // Se usado como wrapper de componente
  if (props.children) {
    return (
      <Suspense fallback={<div className="page-content"><div className="container-fluid">Carregando...</div></div>}>
        {props.children}
      </Suspense>
    )
  }

  // Se usado como layout route
  return <Outlet />
}

export default Authmiddleware
