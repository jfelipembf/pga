// Profile
import UserProfile from "../pages/Authentication/user-profile"

import ActivitiesList from "../pages/Admin/Activities"
import AreasPage from "../pages/Admin/Areas"
import CatalogPage from "../pages/Admin/Catalog"
import CollaboratorsList from "../pages/Admin/Collaborators/List"
import ClassesPage from "../pages/Admin/Classes"
import CashierPage from "../pages/Financial/Cashier"
import CashierPrintPage from "../pages/Financial/Cashier/Components/Print"
import CashFlowPage from "../pages/Financial/CashFlow"
import FinancialDashboard from "../pages/Financial/Dashboard"
import AcquirersPage from "../pages/Financial/Acquirers"
import ReceivablesPage from "../pages/Financial/Receivables"
import ClientsList from "../pages/Clients/Components/clientList"
import ClientSalesPage from "../pages/Clients/Components/Sales"
import RolesPage from "../pages/Admin/Roles"
import ContractsPage from "../pages/Admin/Contracts/ContractsPage"
import Grade from "../pages/Grade"
import ClientProfile from "../pages/Clients/Components/Profile"
import ClientEnrollPage from "../pages/Clients/Enroll"
import PlanningEventsPage from "../pages/Events/Planning"
import EvaluationLevelsPage from "../pages/Management/EvaluationLevels"
import Evaluation from "../pages/Evaluation"
import SettingsPage from "../pages/Settings"
import CollaboratorProfile from "../pages/Collaborators/Components/Profile"
import CRMPage from "../pages/CRM"
import IntegrationsPage from "../pages/Management/Integrations"
import AutomationsPage from "../pages/Management/Automations"
import TrainingPlanningPage from "../pages/TrainingPlanning"
import TrainingTVView from "../pages/TrainingPlanning/TVMode/TrainingTVView"
import AuditLogPage from "../pages/Management/AuditLog"
import { Navigate } from "react-router-dom"

// Authentication related pages
import Login from "../pages/Authentication/Login"
import Logout from "../pages/Authentication/Logout"
import Register from "../pages/Authentication/Register"
import ForgetPwd from "../pages/Authentication/ForgetPassword"

// Inner Authentication
import Login1 from "../pages/AuthenticationInner/Login"
import Register1 from "../pages/AuthenticationInner/Register"
import Recoverpw from "../pages/AuthenticationInner/Recoverpw"
import LockScreen from "../pages/AuthenticationInner/auth-lock-screen"
import StaffSelfRegister from "../pages/Authentication/StaffSelfRegister"

import Kiosk from "../pages/Kiosk"

// Dashboard
import Dashboard from "../pages/Dashboard/index"
import OperationalDashboard from "../pages/Dashboard/OperationalDashboard"
import HelpPage from "../pages/Help/index"


//Extra Pages
import PagesBlank from "../pages/Extra Pages/pages-blank";
import Pages404 from "../pages/Extra Pages/pages-404";
import Pages403 from "../pages/Extra Pages/pages-403";
import Pages500 from "../pages/Extra Pages/pages-500";

const userRoutes = [
  { path: "/dashboard/operational", component: <OperationalDashboard /> },
  { path: "/dashboard", component: <Dashboard />, permissions: ["dashboards_management_view"] },
  { path: "/grade", component: <Grade />, permissions: ["grade_manage"] },
  { path: "/admin/roles", component: <RolesPage />, permissions: ["admin_roles"] },
  { path: "/admin/activity", component: <ActivitiesList />, permissions: ["admin_activities"] },
  { path: "/admin/contracts", component: <ContractsPage />, permissions: ["admin_contracts"] },
  { path: "/admin/areas", component: <AreasPage />, permissions: ["admin_areas"] },
  { path: "/admin/classes", component: <ClassesPage />, permissions: ["admin_classes"] },
  { path: "/admin/catalog", component: <CatalogPage />, permissions: ["admin_catalog"] },
  { path: "/financial/cashier", component: <CashierPage />, permissions: ["financial_cashier"] },
  { path: "/financial/cashier/print", component: <CashierPrintPage />, permissions: ["financial_cashier"] },
  { path: "/financial/cashflow", component: <CashFlowPage />, permissions: ["financial_cashflow"] },
  { path: "/financial/dashboard", component: <FinancialDashboard />, permissions: ["dashboards_financial_view"] },
  { path: "/financial/acquirers", component: <AcquirersPage />, permissions: ["financial_acquirers"] },
  { path: "/financial/receivables", component: <ReceivablesPage />, permissions: ["financial_cashflow"] }, // Using cashflow permission for now
  { path: "/clients/profile", component: <ClientProfile />, permissions: ["members_manage"] },
  { path: "/clients/:clientId/enroll", component: <ClientEnrollPage />, permissions: ["sales_purchase"] },
  { path: "/clients/enroll", component: <ClientEnrollPage />, permissions: ["sales_purchase"] },
  { path: "/clients/sales", component: <ClientSalesPage />, permissions: ["sales_purchase"] },
  { path: "/collaborators/profile", component: <CollaboratorProfile />, permissions: ["collaborators_manage"] },
  { path: "/crm", component: <CRMPage />, permissions: ["crm_view"] },
  { path: "/events/planning", component: <PlanningEventsPage />, permissions: ["management_event_plan"] },
  { path: "/management/evaluation-levels", component: <EvaluationLevelsPage />, permissions: ["management_evaluation_levels"] },
  { path: "/management/integrations", component: <IntegrationsPage />, permissions: ["management_integrations"] },
  { path: "/management/automations", component: <AutomationsPage />, permissions: ["management_automations"] },
  { path: "/training-planning", component: <TrainingPlanningPage />, permissions: ["members_manage"] },
  { path: "/training-planning/tv", component: <TrainingTVView />, permissions: ["members_manage"], isFullScreen: true }, // TV Mode
  { path: "/management/audit-log", component: <AuditLogPage />, permissions: ["management_audit_log"] },
  { path: "/evaluation", component: <Evaluation />, permissions: ["management_evaluation_run"] },
  { path: "/admin/settings", component: <SettingsPage />, permissions: ["admin_settings"] },
  // // //profile
  { path: "/profile", component: <UserProfile /> }, // pública para logados
  { path: "/clients", component: <Navigate to="/clients/list" replace />, permissions: ["members_manage"] },
  { path: "/clients/list", component: <ClientsList />, permissions: ["members_manage"] },
  { path: "/collaborators/list", component: <CollaboratorsList />, permissions: ["collaborators_manage"] },

  // Help Center
  { path: "/help", component: <HelpPage /> },
  { path: "/help/:topic", component: <HelpPage /> },

  { path: "/pages-blank", component: <PagesBlank /> },
  { path: "/pages-403", component: <Pages403 /> },
]

const authRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },

  { path: "/pages-404", component: <Pages404 /> },
  { path: "/pages-403", component: <Pages403 /> },
  { path: "/pages-500", component: <Pages500 /> },

  // Authentication Inner
  { path: "/pages-login", component: <Login1 /> },
  { path: "/pages-register", component: <Register1 /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
  { path: "/auth-lock-screen", component: <LockScreen /> },

  // Public Staff Registration
  { path: "/:tenant/:branch/simple-register", component: <StaffSelfRegister /> },



  // Public Kiosk
  { path: "/:tenant/:branch/kiosk", component: <Kiosk /> },
]

export { userRoutes, authRoutes }
