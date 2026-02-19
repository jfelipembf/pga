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
        label: "Dashboard",
        icon: "mdi mdi-view-dashboard-outline",
        path: "/dashboard"
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
        label: "CRM",
        icon: "mdi mdi-account-search-outline",
        path: "/crm",
        permission: "members_manage"
    },

    // METODOLOGIA
    {
        label: "Metodologia",
        icon: "mdi mdi-flask-outline",
        subItems: [
            { label: "Planejamento", path: "/methodology/planning", permission: "management_training_manage" },
            { label: "Avaliações e Testes", path: "/evaluation", permission: "management_evaluation_run" },
            { label: "Atividades", path: "/admin/activities", permission: "admin_activities" },
            { label: "Níveis", path: "/admin/evaluation-levels", permission: "management_evaluation_levels" },
            { label: "Eventos", path: "/admin/events", permission: "management_event_plan" },
        ]
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
            // { label: "Resumo", path: "/financial/dashboard", permission: "dashboards_financial_view" },
            { label: "Caixa", path: "/financial/cashier", permission: "financial_cashier" },
            { label: "Recebíveis", path: "/financial/receivables", permission: "financial_cashflow" },
            { label: "Pagáveis", path: "/financial/payables", permission: "financial_cashflow" },
            { label: "Fluxo de Caixa", path: "/financial/cash-flow", permission: "financial_cashflow" },
            { label: "DRE", path: "/financial/dre", permission: "dashboards_financial_view" },
            { label: "Contas Bancárias", path: "/financial/bank-accounts", permission: "financial_cashflow" },
            { label: "Adquirentes", path: "/financial/acquirers", permission: "financial_acquirers" },
        ]
    },

    // ADMINISTRATIVO
    {
        label: "Administrativo",
        icon: "mdi mdi-cog-outline",
        subItems: [
            { label: "Colaboradores", path: "/admin/staff", permission: "staff_manage" },
            { label: "Áreas", path: "/admin/areas", permission: "admin_areas" },
            { label: "Cargos", path: "/admin/roles", permission: "admin_roles" },
            { label: "Catálogo", path: "/admin/catalog", permission: "admin_catalog" },
            { label: "Contratos", path: "/financial/contracts", permission: "admin_contracts" },
        ]
    },

    // GERENCIAL
    {
        label: "Gerencial",
        icon: "mdi mdi-chart-areaspline",
        subItems: [
            { label: "Turmas", path: "/admin/classes", permission: "admin_classes" },
            { label: "Aulas Experimentais", path: "/management/trials", permission: "members_manage" },
            { label: "Automação", path: "/automation", permission: "management_automations" },
            { label: "Auditoria", path: "/admin/audit-logs", permission: "management_audit_log" },
        ]
    },

    // CONFIGURAÇÕES
    {
        label: "Configurações",
        icon: "mdi mdi-cog-outline",
        subItems: [
            { label: "Dados da Empresa", path: "/settings/company", permission: "settings_company_manage" },
            { label: "Integrações", path: "/settings/integrations", permission: "management_integrations" },
        ]
    },
    {
        label: "Quiosque",
        icon: "mdi mdi-monitor-dashboard",
        path: "/kiosk",
        permission: "kiosk_access"
    }
]
