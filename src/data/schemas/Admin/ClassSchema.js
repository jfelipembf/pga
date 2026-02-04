import * as yup from 'yup'

/**
 * Schema de validação para Turmas (Classes)
 */
export const ClassSchema = yup.object().shape({
    name: yup.string().required('Nome da turma é obrigatório'),
    description: yup.string().nullable(),
    startDate: yup.date().nullable(),
    endDate: yup.date().nullable(),
    schedule: yup.array().of(yup.object()).default([]),
    capacity: yup.number().positive('Capacidade deve ser positiva').nullable(),
    enrolledCount: yup.number().default(0),
    isActive: yup.boolean().default(true),
    status: yup.string().oneOf(['active', 'inactive', 'completed', 'deleted']).default('active'),
    metadata: yup.object().nullable()
})
