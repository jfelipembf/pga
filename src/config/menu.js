/**
 * MENU CONFIGURATION
 * 
 * Define a estrutura visual do menu lateral.
 * Cada item tem:
 * - label: texto exibido
 * - icon: ícone MDI
 * - path: caminho da rota (sem tenant/branch prefix)
 * - permission: permissão necessária para ver este item (opcional)
 * - permissions: array de permissões (qualquer uma dá acesso)
 * - subItems: itens filhos (para menus expansíveis)
 * 
 * IMPORTANTE: Este arquivo NÃO importa componentes React.
 * O mapeamento path -> componente está em routeRegistry.js
 */

export const MENU_STRUCTURE = [
    { label: "Menu", isHeader: true },

    // DASHBOARDS
    {
        label: "Dashboards",
        icon: "mdi mdi-view-dashboard-outline",
        subItems: [
            { label: "Operacional", path: "/dashboard-operational", permission: "dashboards_operational_view" },
            { label: "Gerencial", path: "/dashboard-management", permission: "dashboards_management_view" },
            { label: "Financeiro", path: "/dashboard-financial", permission: "dashboards_financial_view" },
            { label: "Professor", path: "/dashboard-teacher", permission: "dashboards_teacher_view" },
        ]
    },

    // OPERACIONAL
    {
        label: "Grade",
        icon: "mdi mdi-calendar-clock",
        path: "/grade",
        permission: "grade_manage"
    },
    {
        label: "Clientes",
        icon: "mdi mdi-account-group-outline",
        path: "/clients",
        permission: "members_manage"
    },
    {
        label: "Avaliações e Testes",
        icon: "mdi mdi-file-check-outline",
        path: "/evaluation",
        permission: "management_evaluation_run"
    },
    {
        label: "Treinos",
        icon: "mdi mdi-notebook-edit-outline",
        path: "/training",
        permission: "management_training_manage"
    },

    // FINANCEIRO
    {
        label: "Financeiro",
        icon: "mdi mdi-cash-multiple",
        subItems: [
            { label: "Resumo", path: "/financial/dashboard", permission: "dashboards_financial_view" },
            { label: "Caixa", path: "/financial/cashier", permission: "financial_cashier" },
            { label: "Recebíveis", path: "/financial/receivables", permission: "financial_cashflow" },
            { label: "Pagáveis", path: "/financial/payables", permission: "financial_cashflow" },
            { label: "Fluxo de Caixa", path: "/financial/cash-flow", permission: "financial_cashflow" },
            { label: "DRE", path: "/financial/dre", permission: "dashboards_financial_view" },
        ]
    },

    // GERENCIAL
    {
        label: "Gerencial",
        icon: "mdi mdi-chart-areaspline",
        subItems: [
            { label: "Colaboradores", path: "/admin/staff", permission: "staff_manage" },
            { label: "Turmas", path: "/admin/classes", permission: "admin_classes" },
            { label: "Eventos", path: "/admin/events", permission: "management_event_plan" },
            { label: "Inteligência", path: "/automation", permission: "management_automations" },
            { label: "Integrações", path: "/settings/integrations", permission: "management_integrations" },
            { label: "Auditoria", path: "/admin/audit-logs", permission: "management_audit_log" },
        ]
    },

    // CADASTROS
    {
        label: "Cadastros",
        icon: "mdi mdi-cog-outline",
        subItems: [
            { label: "Atividades", path: "/admin/activities", permission: "admin_activities" },
            { label: "Áreas", path: "/admin/areas", permission: "admin_areas" },
            { label: "Cargos", path: "/admin/roles", permission: "admin_roles" },
            { label: "Níveis", path: "/admin/evaluation-levels", permission: "management_evaluation_levels" },
            { label: "Catálogo", path: "/admin/catalog", permission: "admin_catalog" },
            { label: "Contratos", path: "/financial/contracts", permission: "admin_contracts" },
            { label: "Contas Bancárias", path: "/financial/bank-accounts", permission: "financial_cashflow" },
            { label: "Adquirentes", path: "/financial/acquirers", permission: "financial_acquirers" },
        ]
    }
]
