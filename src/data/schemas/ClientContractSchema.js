import * as Yup from 'yup'

/**
 * Schema de validação para Contratos de Cliente.
 */
export const ClientContractSchema = Yup.object().shape({
    // === IDENTIFICAÇÃO ===
    idClient: Yup.string().required('ID do cliente é obrigatório'),
    idSale: Yup.string().nullable(), // Pode ser null se criado manualmente

    // === PLANO ===
    idPlan: Yup.string().required('ID do plano é obrigatório'),
    planName: Yup.string().required('Nome do plano é obrigatório'),
    planType: Yup.string()
        .oneOf(['monthly', 'quarterly', 'semiannual', 'annual', 'single'])
        .default('monthly'),

    // === VIGÊNCIA ===
    startDate: Yup.date().required('Data de início é obrigatória'),
    endDate: Yup.date()
        .required('Data de término é obrigatória')
        .min(Yup.ref('startDate'), 'Data de término deve ser após data de início'),

    // === STATUS DO CONTRATO ===
    status: Yup.string()
        .oneOf(['pending', 'active', 'suspended', 'canceled', 'expired'])
        .default('active'),

    // === FINANCEIRO ===
    value: Yup.number().min(0, 'Valor deve ser positivo').required('Valor é obrigatório'),
    installments: Yup.number().min(1).default(1),
    paidInstallments: Yup.number().min(0).default(0)
})

/**
 * Constantes para Contract Status
 */
export const CONTRACT_STATUS = {
    PENDING: 'pending',     // Aguardando confirmação/pagamento
    ACTIVE: 'active',       // Vigente e válido
    SUSPENDED: 'suspended', // Temporariamente suspenso
    CANCELED: 'canceled',   // Cancelado definitivamente
    EXPIRED: 'expired'      // Vencido (passou da endDate)
}

/**
 * Constantes para Plan Types
 */
export const PLAN_TYPES = {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    SEMIANNUAL: 'semiannual',
    ANNUAL: 'annual',
    SINGLE: 'single' // Pagamento único (ex: Day Pass)
}

/**
 * Labels e cores para UI
 */
export const CONTRACT_STATUS_CONFIG = {
    pending: {
        label: 'Pendente',
        color: 'warning',
        icon: 'clock-outline'
    },
    active: {
        label: 'Ativo',
        color: 'success',
        icon: 'check-circle'
    },
    suspended: {
        label: 'Suspenso',
        color: 'secondary',
        icon: 'pause-circle'
    },
    canceled: {
        label: 'Cancelado',
        color: 'danger',
        icon: 'close-circle'
    },
    expired: {
        label: 'Expirado',
        color: 'dark',
        icon: 'calendar-remove'
    }
}
