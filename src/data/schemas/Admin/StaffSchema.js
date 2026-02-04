import * as yup from 'yup'

/**
 * Schema de validação para Colaboradores (Staff)
 */
export const StaffSchema = yup.object().shape({
    name: yup.string().required('Nome do colaborador é obrigatório'),
    email: yup.string().email('E-mail inválido').nullable(),
    phone: yup.string().nullable(),
    document: yup.string().nullable(),
    photo: yup.string().nullable(),
    roleId: yup.string().nullable(),
    roleName: yup.string().nullable(),
    areaId: yup.string().nullable(),
    areaName: yup.string().nullable(),
    isActive: yup.boolean().default(true),
    status: yup.string().oneOf(['active', 'inactive', 'deleted']).default('active'),
    hireDate: yup.date().nullable(),
    birthDate: yup.date().nullable(),
    metadata: yup.object().nullable()
})
