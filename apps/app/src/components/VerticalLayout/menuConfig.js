import { useMemo } from "react";

const useMenuConfig = (t) => {
    return useMemo(() => [
        {
            id: "dashboard",
            label: t("Dashboard"),
            icon: "mdi mdi-view-dashboard-outline",
            link: "#",
            subMenu: [
                { id: "operational", label: t("Operacional"), icon: "mdi mdi-view-dashboard-outline", link: "/dashboard/operational" },
                { id: "management", label: t("Gerencial"), icon: "mdi mdi-chart-areaspline", link: "/dashboard", permission: "dashboards_management_view" },
                { id: "financial_dash", label: t("Financeiro"), icon: "mdi mdi-cash-multiple", link: "/financial/dashboard", permission: "dashboards_financial_view" },
            ],
        },
        { id: "grade", label: "Grade", icon: "mdi mdi-table-large", link: "/grade", permission: "grade_manage" },
        { id: "clients", label: "Clientes", icon: "mdi mdi-account-multiple-outline", link: "/clients/list", permission: "members_manage" },
        { id: "trainings", label: "Treinos", icon: "mdi mdi-swim", link: "/training-planning", permission: "members_manage" },
        {
            id: "admin",
            label: "Administrativos",
            icon: "mdi mdi-office-building-outline",
            link: "#",
            anyPermission: ["staff_manage", "admin_activities", "admin_contracts", "admin_areas", "admin_roles", "admin_catalog", "admin_classes", "admin_settings"],
            subMenu: [
                { id: "collabs", label: "Colaboradores", link: "/Staff/list", icon: "mdi mdi-account-multiple-check", permission: "staff_manage" },
                { id: "activities", label: "Atividades", link: "/admin/activity", icon: "mdi mdi-clipboard-text-outline", permission: "admin_activities" },
                { id: "contracts", label: "Contratos", link: "/admin/contracts", icon: "mdi mdi-file-document-outline", permission: "admin_contracts" },
                { id: "classes", label: "Turmas", link: "/admin/classes", icon: "mdi mdi-account-clock-outline", permission: "admin_classes" },
                { id: "areas", label: "Áreas", link: "/admin/areas", icon: "mdi mdi-map-marker-radius-outline", permission: "admin_areas" },
                { id: "roles", label: "Cargos e Permissões", link: "/admin/roles", icon: "mdi mdi-shield-account-outline", permission: "admin_roles" },
                { id: "catalog", label: "Produtos e Serviços", link: "/admin/catalog", icon: "mdi mdi-tag-text-outline", permission: "admin_catalog" },
            ],
        },
        {
            id: "financial",
            label: "Financeiro",
            icon: "mdi mdi-cash-multiple",
            link: "#",
            anyPermission: ["financial_cashier", "financial_cashflow", "financial_acquirers"],
            subMenu: [
                { id: "cashier", label: "Caixa", link: "/financial/cashier", icon: "mdi mdi-cash-register", permission: "financial_cashier" },
                { id: "cashflow", label: "Fluxo de Caixa", link: "/financial/cashflow", icon: "mdi mdi-chart-line", permission: "financial_cashflow" },
                { id: "receivables", label: "Contas a Receber", link: "/financial/receivables", icon: "mdi mdi-format-list-checks", permission: "financial_cashflow" },
                { id: "acquirers", label: "Adquirentes", link: "/financial/acquirers", icon: "mdi mdi-credit-card-multiple-outline", permission: "financial_acquirers" },
            ],
        },
        { id: "crm", label: "CRM", icon: "mdi mdi-headset", link: "/crm", permission: "crm_view" },
        {
            id: "gerencial",
            label: "Gerencial",
            icon: "mdi mdi-chart-bar",
            link: "#",
            anyPermission: ["management_event_plan", "management_evaluation_levels", "management_integrations", "management_automations"],
            subMenu: [
                { id: "events", label: "Planejamento de Eventos", link: "/events/planning", icon: "mdi mdi-calendar-star", permission: "management_event_plan" },
                { id: "eval_levels", label: "Níveis de Avaliação", link: "/management/evaluation-levels", icon: "mdi mdi-chart-timeline-variant", permission: "management_evaluation_levels" },
                { id: "integrations", label: "Integrações", link: "/management/integrations", icon: "mdi mdi-api", permission: "management_integrations" },
                { id: "automations", label: "Automações", link: "/management/automations", icon: "mdi mdi-robot-excited-outline", permission: "management_automations" },
                { id: "audit", label: "Logs de Auditoria", link: "/management/audit-log", icon: "mdi mdi-clipboard-list-outline", permission: "management_audit_log" },
            ],
        },
        { id: "settings", label: "Configurações", icon: "mdi mdi-cog-outline", link: "/admin/settings", permission: "admin_settings" },
        { id: "evaluation", label: "Avaliação", icon: "mdi mdi-gesture-tap", link: "/evaluation", permission: "management_evaluation_run" },
        { id: "help", label: "Central de Ajuda", icon: "mdi mdi-help-circle-outline", link: "/help" },
    ], [t]);
};

export default useMenuConfig;
