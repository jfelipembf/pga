/**
 * PERMISSIONS REGISTRY
 * 
 * Single Source of Truth para todas as permissões do sistema.
 * Este arquivo define TODAS as permissões possíveis e seus metadados.
 * 
 * As permissões são salvas no Firestore em cada Role como:
 * { permissions: { permission_id: true/false } }
 * 
 * No login, o saga busca as permissões do cargo do usuário.
 */

export const PERMISSION_CATEGORIES = {
    DASHBOARD: 'Dashboard',
    CADASTROS: 'Cadastros',
    FINANCEIRO: 'Financeiro',
    OPERACIONAL: 'Operacional',
    GERENCIAL: 'Gerencial',
    ADMINISTRACAO: 'Administração',
}

/**
 * Lista master de todas as permissões do sistema.
 * Cada permissão deve ter:
 * - id: identificador único (usado no banco e nas rotas)
 * - label: nome amigável para exibição
 * - description: descrição detalhada
 * - category: categoria para agrupamento na UI
 */
export const PERMISSIONS = [
    {
        id: "dashboards_management_view",
        label: "Dashboard de gestão",
        description: "Acesso aos indicadores e visão gerencial.",
        category: "DASHBOARD",
    },
    {
        id: "dashboards_financial_view",
        label: "Dashboard financeiro",
        description: "Visão detalhada de faturamento, taxas e recebíveis.",
        category: "DASHBOARD",
    },
    {
        id: "dashboards_teacher_view",
        label: "Dashboard do professor",
        description: "Visão de turmas, alunos e tarefas do instrutor.",
        category: "DASHBOARD",
    },
    {
        id: "dashboards_operational_view",
        label: "Dashboard operacional",
        description: "Visão do dia-a-dia, vendas e tarefas.",
        category: "DASHBOARD",
    },

    // CADASTROS
    {
        id: "members_manage",
        label: "Clientes",
        description: "Cadastro, edição e exclusão de clientes.",
        category: "CADASTROS",
    },
    {
        id: "staff_manage",
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
        id: "admin_catalog",
        label: "Catálogo",
        description: "Produtos, serviços e configurações de catálogo.",
        category: "CADASTROS",
    },

    // FINANCEIRO
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

    // OPERACIONAL
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
        id: "management_training_manage",
        label: "Treinos",
        description: "Criar, gerenciar e enviar planilhas de treinos.",
        category: "OPERACIONAL",
    },
    {
        id: "kiosk_access",
        label: "Acesso ao Quiosque",
        description: "Permite acessar o modo quiosque (Autoatendimento).",
        category: "OPERACIONAL",
    },
    {
        id: "methodology_planning",
        label: "Planejamento",
        description: "Acesso à tela de planejamento metodológico.",
        category: "OPERACIONAL",
    },

    // GERENCIAL
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
        category: "ADMINISTRACAO",
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

    // ADMINISTRAÇÃO
    {
        id: "admin_roles",
        label: "Perfis de acesso",
        description: "Gerenciar cargos e permissões.",
        category: "ADMINISTRACAO",
    },
    {
        id: "admin_settings",
        label: "Configurações",
        description: "Acesso às configurações gerais da unidade.",
        category: "ADMINISTRACAO",
    },
    {
        id: "settings_company_manage",
        label: "Dados da empresa",
        description: "Gerenciar informações, logo e endereço da empresa.",
        category: "ADMINISTRACAO",
    },
    {
        id: "admin_areas",
        label: "Áreas",
        description: "Gerenciar áreas físicas e alocação.",
        category: "ADMINISTRACAO",
    },
]

// ============== HELPERS ==============

/**
 * Cria objeto com todas permissões setadas como true
 */
export const ALL_PERMISSIONS_TRUE = PERMISSIONS.reduce((acc, p) => {
    acc[p.id] = true
    return acc
}, {})

/**
 * Cria objeto com todas permissões setadas como false
 */
export const ALL_PERMISSIONS_FALSE = PERMISSIONS.reduce((acc, p) => {
    acc[p.id] = false
    return acc
}, {})

/**
 * Agrupa permissões por categoria (para UI de edição de cargos)
 */
export const PERMISSIONS_BY_CATEGORY = PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
}, {})

/**
 * Lista de categorias disponíveis
 */
export const CATEGORIES = Object.keys(PERMISSIONS_BY_CATEGORY)

/**
 * Busca metadados de uma permissão pelo ID
 */
export const getPermissionById = (id) => PERMISSIONS.find(p => p.id === id)

// ============== DEFAULT ROLES (para seed/fallback) ==============

export const BASE_ROLE_IDS = ["proprietario", "gestor", "coordenador", "professor", "estagiario", "recepcionista", "owner", "totem"]

export const DEFAULT_ROLES = [
    {
        id: "proprietario",
        label: "Proprietário",
        description: "Acesso total e irrestrito a todas as funcionalidades do sistema.",
        permissions: { ...ALL_PERMISSIONS_TRUE },
    },
    {
        id: "gestor",
        label: "Gestor",
        description: "Acesso total ao sistema.",
        permissions: { ...ALL_PERMISSIONS_TRUE },
    },
    {
        id: "coordenador",
        label: "Coordenador",
        description: "Coordena instrutores, agenda e operações diárias.",
        permissions: {
            ...ALL_PERMISSIONS_FALSE,
            dashboards_management_view: true,
            dashboards_teacher_view: true,
            dashboards_operational_view: true,
            members_manage: true,
            staff_manage: true,
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
            settings_company_manage: true,
            sales_purchase: true,

            dashboards_financial_view: true,
            methodology_planning: true,
        },
    },
    {
        id: "professor",
        label: "Professor",
        description: "Instrutor que gerencia suas turmas e presenças.",
        isInstructor: true,
        permissions: {
            ...ALL_PERMISSIONS_FALSE,
            dashboards_teacher_view: true,
            dashboards_operational_view: true,
            admin_activities: true,
            admin_classes: true,
            grade_manage: true,
            management_tests: true,
            management_evaluation_levels: true,
            management_evaluation_run: true,
            methodology_planning: true,
        },
    },
    {
        id: "estagiario",
        label: "Estagiário",
        description: "Estagiário com acesso às turmas e presenças.",
        isInstructor: true,
        permissions: {
            ...ALL_PERMISSIONS_FALSE,
            dashboards_teacher_view: true,
            dashboards_operational_view: true,
            admin_activities: true,
            admin_classes: true,
            grade_manage: true,
            management_tests: true,
            management_evaluation_levels: true,
            management_evaluation_run: true,
            methodology_planning: true,
        },
    },
    {
        id: "recepcionista",
        label: "Recepcionista",
        description: "Controle de entrada, dúvidas e cadastro rápido.",
        permissions: {
            ...ALL_PERMISSIONS_FALSE,
            dashboards_operational_view: true,
            members_manage: true,
            crm_view: true,
            sales_purchase: true,
            financial_cashier: true,
            admin_classes: true,
            methodology_planning: true,
        },
    },
    {
        id: "totem",
        label: "Totem (Quiosque)",
        description: "Usuário restrito para autoatendimento (apenas Quiosque).",
        permissions: {
            // Nenhum acesso além do Quiosque
            // Nota: ALL_PERMISSIONS_FALSE não pode ser usado aqui se PERMISSIONS ainda não tiver 'kiosk_access' quando ALL_PERMISSIONS_FALSE for criado?
            // Não, o array PERMISSIONS é definido antes. Mas ALL_PERMISSIONS_FALSE é derivado de PERMISSIONS.
            // Como estamos editando o arquivo todo, a ordem será mantida.
            // Mas para garantir, vou setar manualmente kiosk_access: true e o resto false.
            // Na verdade, o reduce cria o objeto dinamicamente.
            // Vamos usar uma abordagem segura: espalhar ALL_PERMISSIONS_FALSE (se disponível no escopo) ou definir um objeto vazio.
            // Como estou substituindo o bloco, ALL_PERMISSIONS_FALSE estará disponível NO MOMENTO DA EXECUÇÃO (pois é exportada).
            // Porém, num array declarado abaixo, posso usar referências de cima.
            // Vou usar ...ALL_PERMISSIONS_FALSE e sobrescrever kiosk_access.
            // Espere, o arquivo é lido sequencialmente. const ALL_PERMISSIONS_FALSE é definido DEPOIS de PERMISSIONS e ANTES de DEFAULT_ROLES.
            // Então é seguro usar.
            ...ALL_PERMISSIONS_FALSE,
            kiosk_access: true,
        },
    },
]
