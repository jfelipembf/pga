export const MENU_ITEMS = [
    { label: "Menu", isHeader: true },

    // DASHBOARDS
    {
        label: "Dashboards",
        icon: "mdi mdi-view-dashboard-outline",
        subItems: [
            {
                label: "Geral",
                link: "/dashboard",
                permissions: ["dashboards_management_view", "dashboards_commercial_view"]
            },
            {
                label: "Operacional",
                link: "/dashboard-operational" // Acesso livre para logados
            },
            {
                label: "Gerencial",
                link: "/dashboard-management",
                permission: "dashboards_management_view"
            },
            {
                label: "Financeiro",
                link: "/dashboard-financial",
                permission: "dashboards_financial_view"
            },
        ]
    },

    // OPERACIONAL
    {
        label: "Grade",
        icon: "mdi mdi-calendar-clock",
        link: "/grade",
        permission: "grade_manage"
    },
    {
        label: "Clientes",
        icon: "mdi mdi-account-group-outline",
        link: "/clients",
        permissions: ["members_manage", "crm_view"]
    },
    {
        label: "Avaliações e Testes",
        icon: "mdi mdi-file-check-outline",
        link: "/evaluation",
        permissions: ["management_evaluation_run", "management_tests"]
    },
    {
        label: "Treinos",
        icon: "mdi mdi-notebook-edit-outline",
        link: "/training",
        permission: "management_training_manage"
    },

    // FINANCEIRO
    {
        label: "Financeiro",
        icon: "mdi mdi-cash-multiple",
        permissions: ['financial_cashier', 'financial_cashflow', 'dashboards_financial_view', 'sales_purchase'],
        subItems: [
            { label: "Resumo", link: "/financial/dashboard", permission: "dashboards_financial_view" },
            { label: "Caixa", link: "/financial/cashier", permission: "financial_cashier" },
            // Venda removido pois é rota interna
            { label: "Recebíveis", link: "/financial/receivables", permissions: ['financial_cashflow', 'dashboards_financial_view'] },
            { label: "Pagáveis", link: "/financial/payables", permission: "financial_cashflow" },
            { label: "Fluxo de Caixa", link: "/financial/cash-flow", permission: "financial_cashflow" },
            { label: "DRE", link: "/financial/dre", permission: "financial_cashflow" },
        ]
    },

    // GERENCIAL
    {
        label: "Gerencial",
        icon: "mdi mdi-chart-areaspline",
        permissions: ['staff_manage', 'admin_classes', 'management_event_plan', 'management_automations', 'management_audit_log'],
        subItems: [
            { label: "Colaboradores", link: "/admin/staff", permission: "staff_manage" },
            { label: "Turmas", link: "/admin/classes", permission: "admin_classes" },
            { label: "Eventos", link: "/admin/events", permission: "management_event_plan" },
            { label: "Inteligência", link: "/automation", permission: "management_automations" },
            { label: "Auditoria", link: "/admin/audit-logs", permission: "management_audit_log" },
        ]
    },

    // CADASTROS (ADMINISTRATIVO)
    {
        label: "Cadastros",
        icon: "mdi mdi-cog-outline",
        permissions: ['admin_activities', 'admin_areas', 'admin_roles', 'management_evaluation_levels', 'admin_catalog', 'admin_contracts', 'admin_settings', 'financial_acquirers'],
        subItems: [
            { label: "Atividades", link: "/admin/activities", permission: "admin_activities" },
            { label: "Áreas", link: "/admin/areas", permission: "admin_areas" },
            { label: "Cargos", link: "/admin/roles", permission: "admin_roles" },
            { label: "Níveis", link: "/admin/evaluation-levels", permission: "management_evaluation_levels" },
            { label: "Catálogo", link: "/admin/catalog", permission: "admin_catalog" },
            { label: "Contratos", link: "/financial/contracts", permission: "admin_contracts" },
            { label: "Contas Bancárias", link: "/financial/bank-accounts", permission: "admin_settings" },
            { label: "Adquirentes", link: "/financial/acquirers", permission: "financial_acquirers" },
        ]
    },

];
