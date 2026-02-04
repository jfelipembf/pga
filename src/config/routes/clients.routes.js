import { lazy } from 'react'

/**
 * Configuração de Rotas de Clientes
 */
export const clientsRoutes = {
  path: "/clients",
  meta: {
    title: "Clientes",
    icon: "mdi mdi-account-multiple",
    showInMenu: true,
    menuOrder: 30,
    category: "CADASTROS"
  },
  children: [
    {
      path: "/clients",
      component: lazy(() => import("../../pages/Clients/ClientList")),
      auth: true,
      permission: "members_manage",
      meta: {
        title: "Lista de Clientes",
        icon: "mdi mdi-account-multiple",
        category: "CADASTROS",
        showInMenu: true,
        menuOrder: 1,
        breadcrumb: "Clientes"
      }
    },
    {
      path: "/clients/:id",
      component: lazy(() => import("../../pages/Clients/ClientProfile")),
      auth: true,
      permission: "members_manage",
      meta: {
        title: "Perfil do Cliente",
        showInMenu: false,
        breadcrumb: "Perfil"
      }
    },
    {
      path: "/crm",
      component: lazy(() => import("../../pages/CRM/index")),
      auth: true,
      permission: "crm_view",
      meta: {
        title: "CRM",
        icon: "mdi mdi-account-search",
        category: "CADASTROS",
        showInMenu: true,
        menuOrder: 2,
        breadcrumb: "CRM"
      }
    }
  ]
}
