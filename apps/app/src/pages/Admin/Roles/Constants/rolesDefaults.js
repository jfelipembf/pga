export const PERMISSIONS = [
  {
    id: "dashboards_management_view",
    label: "Dashboard de gestão",
    description: "Acesso aos indicadores e visão gerencial.",
    category: "DASHBOARD",
  },
  {
    id: "dashboards_commercial_view",
    label: "Dashboard comercial",
    description: "Indicadores comerciais, funil e performance de vendas.",
    category: "DASHBOARD",
  },
  {
    id: "members_manage",
    label: "Clientes",
    description: "Cadastro, edição e exclusão de clientes.",
    category: "CADASTROS",
  },
  {
    id: "collaborators_manage",
    label: "Colaboradores",
    description: "Gerenciar colaboradores e perfis de acesso.",
    category: "CADASTROS",
  },
  {
    id: "crm_view",
    label: "CRM",
    description: "Listas de clientes ativos, suspensos, cancelados e leads.",
    category: "CADASTROS",
  },
  {
    id: "admin_contracts",
    label: "Contratos",
    description: "Gerenciar contratos, planos e termos.",
    category: "CADASTROS",
  },
  {
    id: "sales_purchase",
    label: "Vendas e compras",
    description: "Registrar vendas de contratos, produtos e serviços.",
    category: "FINANCEIRO",
  },
  {
    id: "financial_cashier",
    label: "Caixa",
    description: "Operação e impressão do caixa.",
    category: "FINANCEIRO",
  },
  {
    id: "financial_cashflow",
    label: "Fluxo de caixa",
    description: "Relatórios de fluxo e lançamentos financeiros.",
    category: "FINANCEIRO",
  },
  {
    id: "financial_acquirers",
    label: "Adquirentes",
    description: "Configurar taxas e adquirentes de cartão.",
    category: "FINANCEIRO",
  },
  {
    id: "admin_catalog",
    label: "Catálogo",
    description: "Produtos, serviços e configurações de catálogo.",
    category: "CADASTROS",
  },
  {
    id: "admin_roles",
    label: "Perfis de acesso",
    description: "Gerenciar cargos e permissões.",
    category: "ADMINISTRAÇÃO",
  },
  {
    id: "admin_settings",
    label: "Configurações",
    description: "Acesso às configurações gerais da unidade.",
    category: "ADMINISTRAÇÃO",
  },
  {
    id: "admin_activities",
    label: "Atividades",
    description: "Cadastro e configuração de modalidades.",
    category: "OPERACIONAL",
  },
  {
    id: "admin_classes",
    label: "Turmas",
    description: "Gerenciamento de horários e grades das turmas.",
    category: "OPERACIONAL",
  },
  {
    id: "grade_manage",
    label: "Grade",
    description: "Organizar a grade semanal e presenças.",
    category: "OPERACIONAL",
  },
  {
    id: "admin_areas",
    label: "Áreas",
    description: "Gerenciar áreas físicas e alocação.",
    category: "ADMINISTRAÇÃO",
  },
  {
    id: "management_evaluation_levels",
    label: "Níveis de avaliação",
    description: "Configurar níveis e critérios de avaliação.",
    category: "OPERACIONAL",
  },
  {
    id: "management_tests",
    label: "Testes",
    description: "Configurar testes de tempo/distância.",
    category: "OPERACIONAL",
  },
  {
    id: "management_evaluation_run",
    label: "Avaliação",
    description: "Realizar avaliações técnicas dos alunos.",
    category: "OPERACIONAL",
  },
  {
    id: "management_event_plan",
    label: "Planejamento de eventos",
    description: "Planejamento de avaliações, testes e eventos.",
    category: "GERENCIAL",
  },
  {
    id: "management_integrations",
    label: "Integrações",
    description: "Gerenciar integrações externas.",
    category: "GERENCIAL",
  },
  {
    id: "management_automations",
    label: "Automações",
    description: "Gerenciar fluxos automatizados de mensagens.",
    category: "GERENCIAL",
  },
  {
    id: "management_audit_log",
    label: "Logs de auditoria",
    description: "Visualizar histórico de ações administrativas e automações.",
    category: "GERENCIAL",
  },
]

const ALL_TRUE_PERMISSIONS = PERMISSIONS.reduce((acc, permission) => {
  acc[permission.id] = true
  return acc
}, {})

const EMPTY_PERMISSIONS = PERMISSIONS.reduce((acc, permission) => {
  acc[permission.id] = false
  return acc
}, {})

export const BASE_ROLE_IDS = ["proprietario", "gestor", "coordenador", "professor", "recepcionista", "owner"]

export const DEFAULT_ROLES = [
  {
    id: "proprietario",
    label: "Proprietário",
    description: "Acesso total e irrestrito a todas as funcionalidades do sistema.",
    permissions: { ...ALL_TRUE_PERMISSIONS },
  },
  {
    id: "gestor",
    label: "Gestor",
    description: "Acesso total ao sistema.",
    permissions: { ...ALL_TRUE_PERMISSIONS },
  },
  {
    id: "coordenador",
    label: "Coordenador",
    description: "Coordena instrutores, agenda e operações diárias.",
    permissions: {
      ...EMPTY_PERMISSIONS,
      dashboards_management_view: true,
      dashboards_commercial_view: true,
      members_manage: true,
      collaborators_manage: true,
      crm_view: true,
      admin_activities: true,
      admin_classes: true,
      grade_manage: true,
      admin_contracts: true,
      admin_catalog: true,
      admin_settings: true,
      management_tests: true,
      management_evaluation_levels: true,
      management_evaluation_run: true,
      management_event_plan: true,
      management_integrations: true,
      management_automations: true,
      management_audit_log: true,
      sales_purchase: true,
    },
  },
  {
    id: "professor",
    label: "Professor",
    description: "Instrutor que gerencia suas turmas e presenças.",
    isInstructor: true,
    permissions: {
      ...EMPTY_PERMISSIONS,
      dashboards_management_view: true,
      admin_activities: true,
      admin_classes: true,
      grade_manage: true,
      management_tests: true,
      management_evaluation_levels: true,
      management_evaluation_run: true,
    },
  },
  {
    id: "recepcionista",
    label: "Recepcionista",
    description: "Controle de entrada, dúvidas e cadastro rápido.",
    permissions: {
      ...EMPTY_PERMISSIONS,
      dashboards_commercial_view: true,
      members_manage: true,
      crm_view: true,
      sales_purchase: true,
      financial_cashier: true,
      admin_classes: true,
    },
  },
]
