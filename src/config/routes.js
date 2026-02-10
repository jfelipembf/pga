import React from "react"
import { Navigate } from "react-router-dom"

/**
 * ROUTE REGISTRY
 * 
 * Mapeamento centralizado de path -> componente React.
 * Todos os componentes são importados com lazy loading para otimização.
 * 
 * Estrutura:
 * - PROTECTED_ROUTES: Rotas que requerem autenticação
 * - PUBLIC_ROUTES: Rotas públicas (login, erro, etc)
 * - HIDDEN_ROUTES: Rotas acessíveis mas não exibidas no menu
 */

// ============== LAZY IMPORTS ==============
// DASHBOARDS
const Dashboard = React.lazy(() => import("../pages/Dashboard/index"))
const OperationalDashboard = React.lazy(() => import("../pages/Dashboard/Operational/index"))
const ManagementDashboard = React.lazy(() => import("../pages/Dashboard/Management/index"))
const TeacherDashboard = React.lazy(() => import("../pages/Dashboard/Teacher/index"))
const FinancialDashboardView = React.lazy(() => import("../pages/Dashboard/Financial/index"))
const FinancialDashboard = React.lazy(() => import("../pages/Financial/Dashboard/index"))

// FINANCIAL MODULE
const CashierPage = React.lazy(() => import("../pages/Financial/Cashier/index"))
const CashFlowPage = React.lazy(() => import("../pages/Financial/CashFlow/index"))
const DREPage = React.lazy(() => import("../pages/Financial/DRE/index"))
const ContractsList = React.lazy(() => import("../pages/Contracts/index"))
const AcquirersList = React.lazy(() => import("../pages/Financial/Acquirers/index"))
const BankAccountsList = React.lazy(() => import("../pages/Financial/BankAccounts/index"))
const PayablesList = React.lazy(() => import("../pages/Financial/Payables/index"))
const ReceivablesPage = React.lazy(() => import("../pages/Financial/Receivables/index"))
const SalesPoint = React.lazy(() => import("../pages/Sales/SalesPoint/index"))

// OPERATIONAL MODULE
const Grade = React.lazy(() => import("../pages/Grade/index"))
const EnrollmentGrade = React.lazy(() => import("../pages/Grade/EnrollmentGrade/index"))
const Evaluation = React.lazy(() => import("../pages/Evaluation/index"))
const TrainingPlanning = React.lazy(() => import("../pages/TrainingPlanning/index"))
const TrainingTVView = React.lazy(() => import("../pages/TrainingPlanning/TVMode/TrainingTVView"))
const AutomationList = React.lazy(() => import("../pages/Automation/AutomationList"))
const IntegrationPage = React.lazy(() => import("../pages/Integration/index"))

// CRM / MEMBERS
const ClientsList = React.lazy(() => import("../pages/Clients/ClientList"))
const ClientProfile = React.lazy(() => import("../pages/Clients/ClientProfile"))

// ADMINISTRATIVE MODULE
const ActivitiesPage = React.lazy(() => import("../pages/Admin/Activities/ActivitiesPage"))
const AreasPage = React.lazy(() => import("../pages/Admin/Areas/index"))
const RolesPage = React.lazy(() => import("../pages/Admin/Roles/index"))
const EvaluationLevelsPage = React.lazy(() => import("../pages/Admin/EvaluationLevels/index"))
const StaffList = React.lazy(() => import("../pages/Admin/Staff/List"))
const StaffProfile = React.lazy(() => import("../pages/Admin/Staff/StaffProfile"))
const ClassesPage = React.lazy(() => import("../pages/Admin/Classes/index"))
const CatalogPage = React.lazy(() => import("../pages/Admin/Catalog/index"))
const EventsPage = React.lazy(() => import("../pages/Admin/Events/index"))
const AuditLogsPage = React.lazy(() => import("../pages/Admin/AuditLogs/index"))

// UTILITY / UI PAGES
const Chat = React.lazy(() => import("../pages/Chat/Chat"))
const Kanban = React.lazy(() => import("../pages/Kanban"))
const UserProfile = React.lazy(() => import("../pages/Authentication/user-profile"))
const EmailInbox = React.lazy(() => import("../pages/Email/email-inbox"))
const EmailRead = React.lazy(() => import("../pages/Email/email-read"))
const EmailCompose = React.lazy(() => import("../pages/Email/email-compose"))

// AUTH PAGES
const Login = React.lazy(() => import("../pages/Authentication/Login"))
const Logout = React.lazy(() => import("../pages/Authentication/Logout"))
const Register = React.lazy(() => import("../pages/Authentication/Register"))
const ForgetPwd = React.lazy(() => import("../pages/Authentication/ForgetPassword"))

// INNER AUTH PAGES
const Login1 = React.lazy(() => import("../pages/AuthenticationInner/Login"))
const Register1 = React.lazy(() => import("../pages/AuthenticationInner/Register"))
const Recoverpw = React.lazy(() => import("../pages/AuthenticationInner/Recoverpw"))
const LockScreen = React.lazy(() => import("../pages/AuthenticationInner/auth-lock-screen"))

// EXTRA PAGES
const Pages404 = React.lazy(() => import("../pages/Extra Pages/pages-404"))
const Pages500 = React.lazy(() => import("../pages/Extra Pages/pages-500"))
const Pages403 = React.lazy(() => import("../pages/Extra Pages/pages-403"))

// ============== ROUTE DEFINITIONS ==============

/**
 * Rotas protegidas que aparecem no menu.
 * O path é usado para fazer match com menu.js
 */
export const MENU_ROUTES = {
    // Dashboards
    "/dashboard-operational": { component: OperationalDashboard, permission: "dashboards_operational_view" },
    "/dashboard-management": { component: ManagementDashboard, permission: "dashboards_management_view" },
    "/dashboard-financial": { component: FinancialDashboardView, permission: "dashboards_financial_view" },
    "/dashboard-teacher": { component: TeacherDashboard, permission: "dashboards_teacher_view" },

    // Operacional
    "/grade": { component: Grade, permission: "grade_manage" },
    "/clients": { component: ClientsList, permission: "members_manage" },
    "/evaluation": { component: Evaluation, permission: "management_evaluation_run" },
    "/training": { component: TrainingPlanning, permission: "management_training_manage" },

    // Financeiro
    "/financial/dashboard": { component: FinancialDashboard, permission: "dashboards_financial_view" },
    "/financial/cashier": { component: CashierPage, permission: "financial_cashier" },
    "/financial/receivables": { component: ReceivablesPage, permission: "financial_cashflow" },
    "/financial/payables": { component: PayablesList, permission: "financial_cashflow" },
    "/financial/cash-flow": { component: CashFlowPage, permission: "financial_cashflow" },
    "/financial/dre": { component: DREPage, permission: "dashboards_financial_view" },

    // Gerencial
    "/admin/staff": { component: StaffList, permission: "staff_manage" },
    "/admin/classes": { component: ClassesPage, permission: "admin_classes" },
    "/admin/events": { component: EventsPage, permission: "management_event_plan" },
    "/automation": { component: AutomationList, permission: "management_automations" },
    "/settings/integrations": { component: IntegrationPage, permission: "management_integrations" },
    "/admin/audit-logs": { component: AuditLogsPage, permission: "management_audit_log" },

    // Cadastros
    "/admin/activities": { component: ActivitiesPage, permission: "admin_activities" },
    "/admin/areas": { component: AreasPage, permission: "admin_areas" },
    "/admin/roles": { component: RolesPage, permission: "admin_roles" },
    "/admin/evaluation-levels": { component: EvaluationLevelsPage, permission: "management_evaluation_levels" },
    "/admin/catalog": { component: CatalogPage, permission: "admin_catalog" },
    "/financial/contracts": { component: ContractsList, permission: "admin_contracts" },
    "/financial/bank-accounts": { component: BankAccountsList, permission: "financial_cashflow" },
    "/financial/acquirers": { component: AcquirersList, permission: "financial_acquirers" },
}

/**
 * Rotas protegidas que NÃO aparecem no menu
 */
export const HIDDEN_ROUTES = {
    "/clients/:id": { component: ClientProfile, permission: "members_manage" },
    "/grade/enroll": { component: EnrollmentGrade, permission: "grade_manage" },
    // "/training-tv": { component: TrainingTVView },
    "/admin/staff/:id": { component: StaffProfile, permission: "staff_manage" },
    "/sales/new": { component: SalesPoint, permission: "sales_purchase" },
    "/chat": { component: Chat },
    "/kanbanboard": { component: Kanban },
    "/profile": { component: UserProfile },
    "/email-inbox": { component: EmailInbox },
    "/email-read": { component: EmailRead },
    "/email-compose": { component: EmailCompose },
}

/**
 * Rotas públicas (não requerem autenticação)
 */
export const PUBLIC_ROUTES = {
    "/login": { component: Login },
    "/logout": { component: Logout },
    "/forgot-password": { component: ForgetPwd },
    "/register": { component: Register },
    "/pages-404": { component: Pages404 },
    "/pages-500": { component: Pages500 },
    "/pages-403": { component: Pages403 },
    "/pages-login": { component: Login1 },
    "/pages-register": { component: Register1 },
    "/page-recoverpw": { component: Recoverpw },
    "/auth-lock-screen": { component: LockScreen },
}

// ============== HELPERS ==============

/**
 * Converte o registry em array para uso no React Router
 */
export const getProtectedRoutes = () => {
    const routes = []

    // Menu routes
    Object.entries(MENU_ROUTES).forEach(([path, config]) => {
        routes.push({ path, ...config })
    })

    // Hidden routes
    Object.entries(HIDDEN_ROUTES).forEach(([path, config]) => {
        routes.push({ path, ...config })
    })

    // Default redirect
    routes.push({
        path: "/",
        component: <Navigate to="/dashboard-operational" replace />,
    })

    return routes
}

/**
 * Converte rotas públicas em array
 */
export const getPublicRoutes = () => {
    return Object.entries(PUBLIC_ROUTES).map(([path, config]) => ({
        path,
        ...config
    }))
}

/**
 * Busca configuração de uma rota pelo path
 */
export const getRouteConfig = (path) => {
    return MENU_ROUTES[path] || HIDDEN_ROUTES[path] || PUBLIC_ROUTES[path] || null
}
