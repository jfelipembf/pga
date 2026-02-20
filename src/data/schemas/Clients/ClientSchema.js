import * as Yup from 'yup'

/**
 * Schema de validação para a entidade Cliente.
 * Atualizado para incluir lifecycle completo (funil de vendas).
 */
export const ClientSchema = Yup.object().shape({
    // === DADOS PESSOAIS (Obrigatórios) ===
    firstName: Yup.string().required('Nome é obrigatório').min(2, 'Mínimo 2 caracteres'),
    lastName: Yup.string().required('Sobrenome é obrigatório').min(2, 'Mínimo 2 caracteres'),
    birthDate: Yup.string().required('Data de nascimento é obrigatória'),
    phone: Yup.string().required('O telefone é obrigatório'),
    email: Yup.string().email('E-mail inválido').required('O e-mail é obrigatório'),

    // === DADOS PESSOAIS (Opcionais) ===
    cpf: Yup.string().nullable(),
    gender: Yup.string().nullable(),
    photoURL: Yup.string().url().nullable(),

    // === ENDEREÇO (Opcionais) ===
    zipCode: Yup.string().nullable(),
    street: Yup.string().nullable(),
    number: Yup.string().nullable(),
    neighborhood: Yup.string().nullable(),
    city: Yup.string().nullable(),
    state: Yup.string().nullable(),
    complement: Yup.string().nullable(),

    // === CONTATO DE EMERGÊNCIA (Opcionais) ===
    emergencyName: Yup.string().nullable(),
    emergencyPhone: Yup.string().nullable(),
    emergencyRelation: Yup.string().nullable(),

    // === DADOS DE SAÚDE ===
    healthObservations: Yup.string().nullable(),
    healthRestrictions: Yup.array().of(Yup.string()).nullable(),

    // === CICLO DE VIDA (FUNIL) ===
    lifecycleStatus: Yup.string()
        .oneOf(['lead', 'scheduled', 'attended', 'active', 'suspended', 'inactive', 'lost', 'converted', 'waiting', 'negotiation'])
        .default('lead'),

    leadSource: Yup.string().nullable(), // instagram, google, indicacao, etc
    referredBy: Yup.string().nullable(), // ID do cliente que indicou
})

/**
 * Constantes para Lifecycle Status
 */
export const LIFECYCLE_STATUS = {
    LEAD: 'lead',
    SCHEDULED: 'scheduled',
    ATTENDED: 'attended',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive',
    LOST: 'lost',
    CONVERTED: 'converted',
    WAITING: 'waiting',
    NEGOTIATION: 'negotiation'
}

/**
 * Transições válidas entre status
 */
export const VALID_TRANSITIONS = {
    'lead': ['scheduled', 'active', 'lost'],
    'scheduled': ['attended', 'active', 'lost'],
    'attended': ['active', 'lost'],
    'active': ['suspended', 'inactive'],
    'suspended': ['active', 'inactive'],
    'inactive': ['active', 'lost'],
    'lost': [] // Estado final
}

/**
 * Labels e cores para UI
 */
export const LIFECYCLE_STATUS_CONFIG = {
    lead: {
        label: 'Lead',
        color: 'warning',
        icon: 'account-plus'
    },
    scheduled: {
        label: 'Agendado',
        color: 'info',
        icon: 'calendar-check'
    },
    attended: {
        label: 'Compareceu',
        color: 'primary',
        icon: 'check-circle'
    },
    active: {
        label: 'Ativo',
        color: 'success',
        icon: 'account-check'
    },
    suspended: {
        label: 'Suspenso',
        color: 'secondary',
        icon: 'pause-circle'
    },
    inactive: {
        label: 'Inativo',
        color: 'danger',
        icon: 'account-off'
    },
    lost: {
        label: 'Perdido',
        color: 'dark',
        icon: 'account-remove'
    }
}
