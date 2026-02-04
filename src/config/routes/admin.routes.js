import { lazy } from 'react'

/**
 * Configuração de Rotas Administrativas
 * Modelo Enterprise com metadados de permissões
 */
export const adminRoutes = {
  path: "/admin",
  meta: {
    title: "Administrativo",
    icon: "mdi mdi-cog",
    showInMenu: true,
    menuOrder: 100,
    category: "ADMINISTRAÇÃO"
  },
  children: [
    {
      path: "/admin/activities",
      component: lazy(() => import("../../pages/Admin/Activities/ActivitiesPage")),
      auth: true,
      permission: "admin_activities",
      meta: {
        title: "Atividades",
        icon: "mdi mdi-run",
        category: "OPERACIONAL",
        showInMenu: true,
        menuOrder: 1,
        breadcrumb: "Atividades"
      }
    },
    {
      path: "/admin/areas",
      component: lazy(() => import("../../pages/Admin/Areas/index")),
      auth: true,
      permission: "admin_areas",
      meta: {
        title: "Áreas",
        icon: "mdi mdi-office-building",
        category: "ADMINISTRAÇÃO",
        showInMenu: true,
        menuOrder: 2,
        breadcrumb: "Áreas"
      }
    },
    {
      path: "/admin/roles",
      component: lazy(() => import("../../pages/Admin/Roles/index")),
      auth: true,
      permission: "admin_roles",
      meta: {
        title: "Funções/Cargos",
        icon: "mdi mdi-account-tie",
        category: "ADMINISTRAÇÃO",
        showInMenu: true,
        menuOrder: 3,
        breadcrumb: "Funções"
      }
    },
    {
      path: "/admin/staff",
      component: lazy(() => import("../../pages/Admin/Staff/List")),
      auth: true,
      permission: "staff_manage",
      meta: {
        title: "Colaboradores",
        icon: "mdi mdi-account-group",
        category: "CADASTROS",
        showInMenu: true,
        menuOrder: 4,
        breadcrumb: "Colaboradores"
      }
    },
    {
      path: "/admin/classes",
      component: lazy(() => import("../../pages/Admin/Classes/index")),
      auth: true,
      permission: "admin_classes",
      meta: {
        title: "Turmas",
        icon: "mdi mdi-google-classroom",
        category: "OPERACIONAL",
        showInMenu: true,
        menuOrder: 5,
        breadcrumb: "Turmas"
      }
    },
    {
      path: "/admin/catalog",
      component: lazy(() => import("../../pages/Admin/Catalog/index")),
      auth: true,
      permission: "admin_catalog",
      meta: {
        title: "Catálogo",
        icon: "mdi mdi-package-variant",
        category: "CADASTROS",
        showInMenu: true,
        menuOrder: 6,
        breadcrumb: "Catálogo"
      }
    },
    {
      path: "/admin/audit-logs",
      component: lazy(() => import("../../pages/Admin/AuditLogs/index")),
      auth: true,
      permission: "management_audit_log",
      meta: {
        title: "Auditoria",
        icon: "mdi mdi-history",
        category: "GERENCIAL",
        showInMenu: true,
        menuOrder: 7,
        breadcrumb: "Logs de Auditoria"
      }
    }
  ]
}
