import { lazy } from 'react'

/**
 * Configuração de Rotas de Dashboard
 */
export const dashboardRoutes = {
  path: "/dashboard",
  component: lazy(() => import("../../pages/Dashboard/index")),
  auth: true,
  permissions: ["dashboards_management_view", "dashboards_commercial_view", "dashboards_financial_view"],
  requireAll: false, // Qualquer uma das permissões
  meta: {
    title: "Dashboard",
    icon: "mdi mdi-view-dashboard",
    category: "DASHBOARD",
    showInMenu: true,
    menuOrder: 1,
    breadcrumb: "Dashboard"
  }
}
