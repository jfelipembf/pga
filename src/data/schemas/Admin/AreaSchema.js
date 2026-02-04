import * as yup from 'yup'

/**
 * Schema de validação para Áreas (Areas)
 */
export const AreaSchema = yup.object().shape({
    name: yup.string().required('Nome da área é obrigatório'),
    description: yup.string().nullable(),
    color: yup.string().nullable(),
    isActive: yup.boolean().default(true),
    status: yup.string().oneOf(['active', 'inactive', 'deleted']).default('active'),
    metadata: yup.object().nullable()
})
