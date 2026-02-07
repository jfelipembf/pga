import React from "react"
import { Navigate } from "react-router-dom"

// Profile
import UserProfile from "../pages/Authentication/user-profile"

// Pages Grade
import Grade from "../pages/Grade/index"
import EnrollmentGrade from "../pages/Grade/EnrollmentGrade/index"
import Evaluation from "../pages/Evaluation/index"
import TrainingPlanning from "../pages/TrainingPlanning/index";
import TrainingTVView from "../pages/TrainingPlanning/TVMode/TrainingTVView";
import AutomationList from "../pages/Automation/AutomationList"
import IntegrationPage from "../pages/Integration/index"

//Email
import EmailInbox from "../pages/Email/email-inbox"
import EmailRead from "../pages/Email/email-read"
import EmailCompose from "../pages/Email/email-compose"

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

// Dashboard
import Dashboard from "../pages/Dashboard/index"

// Financial
import CashierPage from "../pages/Financial/Cashier/index"
import CashFlowPage from "../pages/Financial/CashFlow/index"
import DREPage from "../pages/Financial/DRE/index"
import ContractsList from "../pages/Contracts/index"
import AcquirersList from "../pages/Financial/Acquirers/index"
import BankAccountsList from "../pages/Financial/BankAccounts/index"
import PayablesList from "../pages/Financial/Payables/index"
import ReceivablesPage from "../pages/Financial/Receivables/index"
import SalesPoint from "../pages/Sales/SalesPoint/index"
import FinancialDashboard from "../pages/Financial/Dashboard/index"

// Clients
import ClientsList from "../pages/Clients/ClientList"
import ClientProfile from "../pages/Clients/ClientProfile"

//Charts
import ChartsAppex from "../pages/Charts/charts-appex";
import ChartsJs from "../pages/Charts/charts-chartjs";
import ChartsKnob from "../pages/Charts/charts-knob";
import ChartsSparkLine from "../pages/Charts/charts-sparkline";

// Maps
import MapsGoogle from "../pages/Maps/MapsGoogle"
import MapsVector from "../pages/Maps/MapsVector"

//Icons
import IconMaterialdesign from "../pages/Icons/IconMaterialdesign"
import Iconion from "../pages/Icons/Iconion"
import IconFontawesome from "../pages/Icons/IconFontawesome"
import IconThemify from "../pages/Icons/IconThemify"
import IconDripicons from "../pages/Icons/IconDripicons"
import IconTypicons from "../pages/Icons/IconTypicons"

//Tables
import BasicTables from "../pages/Tables/BasicTables"
import DatatableTables from "../pages/Tables/DatatableTables"
import ResponsiveTables from "../pages/Tables/ResponsiveTables"

// Forms
import FormElements from "../pages/Forms/FormElements"
import FormAdvanced from "../pages/Forms/FormAdvanced"
import FormEditors from "../pages/Forms/FormEditors"
import FormValidations from "../pages/Forms/FormValidations"
import FormUpload from "../pages/Forms/FormUpload"

//Ui
import UiAlert from "../pages/Ui/UiAlert"
import UiButtons from "../pages/Ui/UiButtons"
import UiBadge from "../pages/Ui/UiBadge"
import UiCards from "../pages/Ui/UiCards"
import UiCarousel from "../pages/Ui/UiCarousel"
import UiDropdown from "../pages/Ui/UiDropdown"
import UiGrid from "../pages/Ui/UiGrid"
import UiImages from "../pages/Ui/UiImages"
import UiLightbox from "../pages/Ui/UiLightbox"
import UiModal from "../pages/Ui/UiModal"
import UiPagination from "../pages/Ui/UiPagination"
import UiPopoverTooltips from "../pages/Ui/UiPopoverTooltips"
import UiProgressbar from "../pages/Ui/UiProgressbar"
import UiTabsAccordions from "../pages/Ui/UiTabsAccordions"
import UiTypography from "../pages/Ui/UiTypography"
import UiVideo from "../pages/Ui/UiVideo"
import UiSessionTimeout from "../pages/Ui/UiSessionTimeout"
import UiRangeSlider from "../pages/Ui/UiRangeSlider"

//Extra Pages
import PagesTimeline from "../pages/Extra Pages/pages-timeline";
import PagesInvoice from "../pages/Extra Pages/pages-invoice";
import PagesDirectory from "../pages/Extra Pages/pages-directory";
import PagesBlank from "../pages/Extra Pages/pages-blank";
import Pages404 from "../pages/Extra Pages/pages-404";
import Pages500 from "../pages/Extra Pages/pages-500";
import Pages403 from "../pages/Extra Pages/pages-403";
import UiUtilities from "pages/Ui/UiUtilities"
import UiColors from "pages/Ui/UiColors"
import UiOffcanvas from "pages/Ui/UiOffcanvas"
import Chat from "pages/Chat/Chat";
import Kanban from "pages/Kanban"
import AuditLogsPage from "../pages/Admin/AuditLogs/index"
import AreasPage from "../pages/Admin/Areas/index"
import ActivitiesPage from "../pages/Admin/Activities/ActivitiesPage"
import RolesPage from "../pages/Admin/Roles/index"
import EvaluationLevelsPage from "../pages/Admin/EvaluationLevels/index"
import StaffList from "../pages/Admin/Staff/List"
import StaffProfile from "../pages/Admin/Staff/StaffProfile"
import ClassesPage from "../pages/Admin/Classes/index"
import CatalogPage from "../pages/Admin/Catalog/index"
import EventsPage from "../pages/Admin/Events/index"

import OperationalDashboard from "../pages/Dashboard/Operational/index"

// ...

const userRoutes = [
  { path: "/dashboard", component: <Dashboard />, permission: ["dashboards_management_view", "dashboards_commercial_view"] },
  { path: "/dashboard-operational", component: <OperationalDashboard />, permission: "dashboards_management_view" },
  { path: "/financial/dashboard", component: <FinancialDashboard />, permission: "dashboards_financial_view" },
  { path: "/financial/cashier", component: <CashierPage />, permission: "financial_cashier" },
  { path: "/financial/cash-flow", component: <CashFlowPage />, permission: "financial_cashflow" },
  { path: "/financial/dre", component: <DREPage />, permission: "dashboards_financial_view" },
  { path: "/financial/contracts", component: <ContractsList />, permission: "admin_contracts" },
  { path: "/financial/acquirers", component: <AcquirersList />, permission: "financial_acquirers" },
  { path: "/financial/bank-accounts", component: <BankAccountsList />, permission: "financial_acquirers" },
  { path: "/financial/payables", component: <PayablesList />, permission: "dashboards_financial_view" },
  { path: "/financial/receivables", component: <ReceivablesPage />, permission: "dashboards_financial_view" },
  { path: "/sales/new", component: <SalesPoint />, permission: "sales_purchase" },

  // Clients
  { path: "/clients", component: <ClientsList />, permission: "members_manage" },
  { path: "/clients/:id", component: <ClientProfile />, permission: "members_manage" },

  // Grade
  { path: "/grade", component: <Grade />, permission: "grade_manage" },
  { path: "/grade/enroll", component: <EnrollmentGrade />, permission: "grade_manage" },

  // Evaluation
  { path: "/evaluation", component: <Evaluation />, permission: "management_evaluation_run" },

  // Training Planning
  { path: "/training", component: <TrainingPlanning />, permission: "management_training_manage" },
  { path: "/training-tv", component: <TrainingTVView /> },

  // Automation
  { path: "/automation", component: <AutomationList />, permission: "management_automations" },
  { path: "/settings/integrations", component: <IntegrationPage />, permission: "management_integrations" },

  { path: "/chat", component: <Chat /> },
  { path: "/kanbanboard", component: <Kanban /> },

  // Admin Routes
  { path: "/admin/activities", component: <ActivitiesPage />, permission: "admin_activities" },
  { path: "/admin/areas", component: <AreasPage />, permission: "admin_areas" },
  { path: "/admin/roles", component: <RolesPage />, permission: "admin_roles" },
  { path: "/admin/evaluation-levels", component: <EvaluationLevelsPage />, permission: "management_evaluation_levels" },
  { path: "/admin/staff", component: <StaffList />, permission: "staff_manage" },
  { path: "/admin/staff/:id", component: <StaffProfile />, permission: "staff_manage" },
  { path: "/admin/classes", component: <ClassesPage />, permission: "admin_classes" },
  { path: "/admin/catalog", component: <CatalogPage />, permission: "admin_catalog" },
  { path: "/admin/events", component: <EventsPage />, permission: "management_event_plan" },
  { path: "/admin/audit-logs", component: <AuditLogsPage />, permission: "management_audit_log" },

  // // //profile
  { path: "/profile", component: <UserProfile /> },

  // //Email
  { path: "/email-inbox", component: <EmailInbox /> },
  { path: "/email-read", component: <EmailRead /> },
  { path: "/email-compose", component: <EmailCompose /> },

  // //Charts
  { path: "/apex-charts", component: <ChartsAppex /> },
  { path: "/charts-chartjs", component: <ChartsJs /> },
  { path: "/charts-knob", component: <ChartsKnob /> },
  { path: "/sparkline-charts", component: <ChartsSparkLine /> },

  // // Icons
  { path: "/icons-materialdesign", component: <IconMaterialdesign /> },
  { path: "/icons-ion", component: <Iconion /> },
  { path: "/icons-fontawesome", component: <IconFontawesome /> },
  { path: "/icons-themify", component: <IconThemify /> },
  { path: "/icons-dripicons", component: <IconDripicons /> },
  { path: "/icons-typicons", component: <IconTypicons /> },

  // // Tables
  { path: "/tables-basic", component: <BasicTables /> },
  { path: "/tables-datatable", component: <DatatableTables /> },
  { path: "/tables-responsive", component: <ResponsiveTables /> },

  // // Maps
  { path: "/maps-google", component: <MapsGoogle /> },
  { path: "/maps-vector", component: <MapsVector /> },

  // // Forms
  { path: "/form-elements", component: <FormElements /> },
  { path: "/form-advanced", component: <FormAdvanced /> },
  { path: "/form-editors", component: <FormEditors /> },
  { path: "/form-uploads", component: <FormUpload /> },
  { path: "/form-validation", component: <FormValidations /> },

  // // Ui
  { path: "/ui-alerts", component: <UiAlert /> },
  { path: "/ui-buttons", component: <UiButtons /> },
  { path: "/ui-badge", component: <UiBadge /> },
  { path: "/ui-cards", component: <UiCards /> },
  { path: "/ui-carousel", component: <UiCarousel /> },
  { path: "/ui-dropdowns", component: <UiDropdown /> },
  { path: "/ui-grid", component: <UiGrid /> },
  { path: "/ui-images", component: <UiImages /> },
  { path: "/ui-lightbox", component: <UiLightbox /> },
  { path: "/ui-modals", component: <UiModal /> },
  { path: "/ui-pagination", component: <UiPagination /> },
  { path: "/ui-popover-tooltip", component: <UiPopoverTooltips /> },
  { path: "/ui-progressbars", component: <UiProgressbar /> },
  { path: "/ui-tabs-accordions", component: <UiTabsAccordions /> },
  { path: "/ui-typography", component: <UiTypography /> },
  { path: "/ui-video", component: <UiVideo /> },
  { path: "/ui-session-timeout", component: <UiSessionTimeout /> },
  { path: "/ui-rangeslider", component: <UiRangeSlider /> },
  { path: "/ui-utilities", component: <UiUtilities /> },
  { path: "/ui-colors", component: <UiColors /> },
  { path: "/ui-offcanvas", component: <UiOffcanvas /> },

  // //Extra Pages
  { path: "/pages-timeline", component: <PagesTimeline /> },
  { path: "/pages-invoice", component: <PagesInvoice /> },
  { path: "/pages-directory", component: <PagesDirectory /> },
  { path: "/pages-blank", component: <PagesBlank /> },

  // this route should be at the end of all other routes
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
]

const authRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },

  { path: "/pages-404", component: <Pages404 /> },
  { path: "/pages-500", component: <Pages500 /> },
  { path: "/pages-403", component: <Pages403 /> },

  // Authentication Inner
  { path: "/pages-login", component: <Login1 /> },
  { path: "/pages-register", component: <Register1 /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
  { path: "/auth-lock-screen", component: <LockScreen /> },
]

export { userRoutes, authRoutes }