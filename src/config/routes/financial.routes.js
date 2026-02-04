import { lazy } from 'react'

/**
 * Configuração de Rotas Financeiras
 */
export const financialRoutes = {
  path: "/financial",
  meta: {
    title: "Financeiro",
    icon: "mdi mdi-cash-multiple",
    showInMenu: true,
    menuOrder: 50,
    category: "FINANCEIRO"
  },
  children: [
    {
      path: "/financial/dashboard",
      component: lazy(() => import("../../pages/Financial/Dashboard/index")),
      auth: true,
      permission: "dashboards_financial_view",
      meta: {
        title: "Dashboard Financeiro",
        icon: "mdi mdi-chart-line",
        category: "DASHBOARD",
        showInMenu: true,
        menuOrder: 1,
        breadcrumb: "Dashboard"
      }
    },
    {
      path: "/financial/cashier",
      component: lazy(() => import("../../pages/Financial/Cashier/index")),
      auth: true,
      permission: "financial_cashier",
      meta: {
        title: "Caixa",
        icon: "mdi mdi-cash-register",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 2,
        breadcrumb: "Caixa"
      }
    },
    {
      path: "/financial/cashflow",
      component: lazy(() => import("../../pages/Financial/CashFlow/index")),
      auth: true,
      permission: "financial_cashflow",
      meta: {
        title: "Fluxo de Caixa",
        icon: "mdi mdi-chart-timeline-variant",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 3,
        breadcrumb: "Fluxo de Caixa"
      }
    },
    {
      path: "/financial/payables",
      component: lazy(() => import("../../pages/Financial/Payables/index")),
      auth: true,
      permission: "financial_cashflow",
      meta: {
        title: "Contas a Pagar",
        icon: "mdi mdi-cash-minus",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 4,
        breadcrumb: "Contas a Pagar"
      }
    },
    {
      path: "/financial/receivables",
      component: lazy(() => import("../../pages/Financial/Receivables/index")),
      auth: true,
      permission: "financial_cashflow",
      meta: {
        title: "Contas a Receber",
        icon: "mdi mdi-cash-plus",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 5,
        breadcrumb: "Contas a Receber"
      }
    },
    {
      path: "/financial/contracts",
      component: lazy(() => import("../../pages/Contracts/index")),
      auth: true,
      permission: "admin_contracts",
      meta: {
        title: "Planos e Contratos",
        icon: "mdi mdi-file-document-multiple",
        category: "CADASTROS",
        showInMenu: true,
        menuOrder: 6,
        breadcrumb: "Contratos"
      }
    },
    {
      path: "/financial/acquirers",
      component: lazy(() => import("../../pages/Financial/Acquirers/index")),
      auth: true,
      permission: "financial_acquirers",
      meta: {
        title: "Adquirentes",
        icon: "mdi mdi-credit-card-settings",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 7,
        breadcrumb: "Adquirentes"
      }
    },
    {
      path: "/financial/bank-accounts",
      component: lazy(() => import("../../pages/Financial/BankAccounts/index")),
      auth: true,
      permission: "financial_cashflow",
      meta: {
        title: "Contas Bancárias",
        icon: "mdi mdi-bank",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 8,
        breadcrumb: "Contas Bancárias"
      }
    },
    {
      path: "/financial/dre",
      component: lazy(() => import("../../pages/Financial/DRE/index")),
      auth: true,
      permission: "dashboards_financial_view",
      meta: {
        title: "DRE",
        icon: "mdi mdi-file-chart",
        category: "FINANCEIRO",
        showInMenu: true,
        menuOrder: 9,
        breadcrumb: "DRE"
      }
    }
  ]
}
