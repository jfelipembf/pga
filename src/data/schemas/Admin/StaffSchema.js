import * as yup from 'yup'

/**
 * Schema de validação para Colaboradores (Staff)
 */
export const StaffSchema = yup.object().shape({
    name: yup.string().required('Nome do colaborador é obrigatório'),
    email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
    document: yup.string().nullable(),
    phone: yup.string().required('Telefone é obrigatório'),
    cpf: yup.string().required('CPF é obrigatório'),
    password: yup.string()
        .min(6, 'A senha deve ter pelo menos 6 caracteres')
        .required('Senha é obrigatória'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'As senhas devem ser iguais')
        .required('Confirmação de senha é obrigatória'),
    photo: yup.string().nullable(),
    roleId: yup.string().required('Cargo é obrigatório'),
    roleName: yup.string().nullable(),
    isActive: yup.boolean().default(true),
    status: yup.string().oneOf(['active', 'inactive', 'suspended', 'deleted'], 'Status inválido').default('active'),
    hireDate: yup.date().typeError('Data de contratação inválida').nullable(),
    birthDate: yup.date().typeError('Data de nascimento inválida').nullable(),

    // Novos campos Profissionais e Endereço
    professionalId: yup.string().nullable(), // Conselho (CRM, CREF, etc)
    salary: yup.number().nullable(),

    zipCode: yup.string().nullable(),
    street: yup.string().nullable(),
    number: yup.string().nullable(),
    complement: yup.string().nullable(),
    neighborhood: yup.string().nullable(),
    city: yup.string().nullable(),
    state: yup.string().nullable(),

    metadata: yup.object().nullable()
})

/**
 * Schema de validação para Atualização de Colaboradores (sem senha obrigatória)
 */
export const StaffUpdateSchema = StaffSchema.shape({
    password: yup.string().nullable().notRequired(),
    confirmPassword: yup.string().nullable().notRequired()
})
