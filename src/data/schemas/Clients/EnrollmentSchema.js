import * as Yup from 'yup'

/**
 * Schema de validação para Matrículas de Alunos
 */
export const EnrollmentSchema = Yup.object().shape({
    // === IDENTIFICAÇÃO ===
    idClient: Yup.string().required('ID do cliente é obrigatório'),
    idContract: Yup.string().nullable(), // Null se for experimental
    idClass: Yup.string().required('ID da turma é obrigatório'),

    // === INFORMAÇÕES COPIADAS (Denormalization) ===
    clientName: Yup.string().required('Nome do cliente é obrigatório'),
    className: Yup.string().nullable(),
    activityName: Yup.string().nullable(),
    startTime: Yup.string().nullable(),
    endTime: Yup.string().nullable(),
    weekday: Yup.number().nullable(),
    instructorName: Yup.string().nullable(),
    areaName: Yup.string().nullable(),
    idActivity: Yup.string().nullable(),
    idStaff: Yup.string().nullable(),

    // === TIPO DE MATRÍCULA ===
    enrollmentType: Yup.string()
        .oneOf(['regular', 'trial'], 'Tipo inválido')
        .required('Tipo de matrícula é obrigatório'),

    // === STATUS ===
    status: Yup.string()
        .oneOf(['active', 'suspended', 'completed', 'cancelled'])
        .default('active'),

    // === DATAS ===
    enrolledAt: Yup.date().required('Data de matrícula é obrigatória'),
    startDate: Yup.string().required('Data de início é obrigatória'), // YYYY-MM-DD
    endDate: Yup.string().nullable(), // YYYY-MM-DD ou null se indefinido

    // === ESTATÍSTICAS ===
    totalSessions: Yup.number().min(0).default(0),
    attendedSessions: Yup.number().min(0).default(0),
    missedSessions: Yup.number().min(0).default(0)
})

/**
 * Schema para cliente matriculado em uma sessão específica
 */
export const SessionEnrollmentSchema = Yup.object().shape({
    enrollmentId: Yup.string().required(),
    idClient: Yup.string().required(),
    clientName: Yup.string().required(),
    enrollmentType: Yup.string().oneOf(['regular', 'trial']).required(),
    attended: Yup.boolean().nullable().default(null),
    enrolledAt: Yup.date().required(),
    createdBy: Yup.string().required()
})

/**
 * Constantes para Tipos de Matrícula
 */
export const ENROLLMENT_TYPE = {
    REGULAR: 'regular',     // Matrícula normal com contrato
    TRIAL: 'trial'          // Aula experimental
}

/**
 * Constantes para Status de Matrícula
 */
export const ENROLLMENT_STATUS = {
    ACTIVE: 'active',           // Matrícula ativa
    SUSPENDED: 'suspended',     // Temporariamente suspensa
    COMPLETED: 'completed',     // Concluída normalmente
    CANCELLED: 'cancelled'      // Cancelada
}

/**
 * Labels e cores para UI
 */
export const ENROLLMENT_STATUS_CONFIG = {
    active: {
        label: 'Ativa',
        color: 'success',
        icon: 'check-circle',
        badge: 'bg-success'
    },
    suspended: {
        label: 'Suspensa',
        color: 'warning',
        icon: 'pause-circle',
        badge: 'bg-warning'
    },
    completed: {
        label: 'Concluída',
        color: 'info',
        icon: 'check-all',
        badge: 'bg-info'
    },
    cancelled: {
        label: 'Cancelada',
        color: 'danger',
        icon: 'close-circle',
        badge: 'bg-danger'
    }
}

/**
 * Labels para Tipos de Matrícula
 */
export const ENROLLMENT_TYPE_CONFIG = {
    regular: {
        label: 'Regular',
        color: 'primary',
        icon: 'account-check',
        badge: 'bg-primary'
    },
    trial: {
        label: 'Experimental',
        color: 'warning',
        icon: 'star',
        badge: 'bg-warning'
    }
}
