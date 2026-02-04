import { lazy } from 'react'

/**
 * Configuração de Rotas de Vendas
 */
export const salesRoutes = {
  path: "/sales",
  meta: {
    title: "Vendas",
    icon: "mdi mdi-cart",
    showInMenu: true,
    menuOrder: 40,
    category: "FINANCEIRO"
  },
  children: [
    {
      path: "/sales/point",
      component: lazy(() => import("../../pages/Sales/SalesPoint/index")),
      auth: true,
      permission: "sales_purchase",
      meta: {
        title: "Ponto de Venda",
        icon: "mdi mdi-point-of-sale",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 1,
        breadcrumb: "PDV"
      }
    }
  ]
}
