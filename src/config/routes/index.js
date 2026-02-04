import { adminRoutes } from './admin.routes'
import { financialRoutes } from './financial.routes'
import { clientsRoutes } from './clients.routes'
import { dashboardRoutes } from './dashboard.routes'
import { salesRoutes } from './sales.routes'

/**
 * Configuração Central de Rotas
 * Single Source of Truth para rotas + menu + permissões
 */

/**
 * Rotas que requerem autenticação
 */
export const protectedRoutes = [
  dashboardRoutes,
  clientsRoutes,
  salesRoutes,
  financialRoutes,
  adminRoutes,
]

/**
 * Rotas públicas (sem autenticação)
 */
export const publicRoutes = [
  {
    path: "/login",
    component: () => import("../../pages/Authentication/Login"),
    meta: { title: "Login" }
  },
  {
    path: "/register",
    component: () => import("../../pages/Authentication/Register"),
    meta: { title: "Cadastro" }
  },
  {
    path: "/forgot-password",
    component: () => import("../../pages/Authentication/ForgetPassword"),
    meta: { title: "Recuperar Senha" }
  },
  {
    path: "/logout",
    component: () => import("../../pages/Authentication/Logout"),
    meta: { title: "Sair" }
  }
]

/**
 * Flatten routes para uso em React Router
 */
export const flattenRoutes = (routes, parentPath = '') => {
  let flattened = []
  
  routes.forEach(route => {
    const fullPath = parentPath + route.path
    
    // Adiciona a rota atual
    if (route.component) {
      flattened.push({
        ...route,
        path: fullPath,
        fullPath
      })
    }
    
    // Adiciona filhos recursivamente
    if (route.children && route.children.length > 0) {
      flattened = flattened.concat(
        flattenRoutes(route.children, route.path === '/' ? '' : route.path)
      )
    }
  })
  
  return flattened
}

/**
 * Retorna todas as rotas (protegidas + públicas)
 */
export const getAllRoutes = () => {
  return [
    ...flattenRoutes(protectedRoutes),
    ...publicRoutes
  ]
}

/**
 * Retorna apenas rotas que devem aparecer no menu
 */
export const getMenuRoutes = () => {
  return getAllRoutes().filter(route => route.meta?.showInMenu)
}

/**
 * Agrupa rotas por categoria
 */
export const groupRoutesByCategory = (routes) => {
  return routes.reduce((acc, route) => {
    const category = route.meta?.category || 'OUTROS'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(route)
    return acc
  }, {})
}
