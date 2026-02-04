import * as yup from 'yup'

/**
 * Schema de validação para Atividades (Activities)
 * Objectives e Topics são objetos aninhados validados em runtime
 */
export const ActivitySchema = yup.object().shape({
    name: yup.string().required('Nome da atividade é obrigatório'),
    description: yup.string().nullable(),
    color: yup.string().nullable(),
    photo: yup.string().nullable(),
    photoUrl: yup.string().nullable(),
    isActive: yup.boolean().default(true),
    status: yup.string().oneOf(['active', 'paused', 'deleted']).default('active'),
    objectives: yup.object().default({}),
    schedule: yup.array().of(yup.object()).default([]),
    order: yup.number().default(0),
    metadata: yup.object().nullable()
})
