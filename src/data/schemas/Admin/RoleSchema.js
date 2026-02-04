import * as yup from 'yup'

/**
 * Schema de validação para Funções/Cargos (Roles)
 */
export const RoleSchema = yup.object().shape({
    name: yup.string().required('Nome da função é obrigatório'),
    description: yup.string().nullable(),
    permissions: yup.object().default({}),
    isActive: yup.boolean().default(true),
    status: yup.string().oneOf(['active', 'inactive', 'deleted']).default('active'),
    metadata: yup.object().nullable()
})
