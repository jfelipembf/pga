import * as Yup from 'yup'

/**
 * Schema de validação para a entidade Cliente.
 */
export const ClientSchema = Yup.object().shape({
    // Dados Pessoais (Obrigatórios)
    firstName: Yup.string().required('Nome é obrigatório').min(2, 'Mínimo 2 caracteres'),
    lastName: Yup.string().required('Sobrenome é obrigatório').min(2, 'Mínimo 2 caracteres'),
    birthDate: Yup.string().required('Data de nascimento é obrigatória'),
    phone: Yup.string().required('O telefone é obrigatório'),
    email: Yup.string().email('E-mail inválido').required('O e-mail é obrigatório'),

    // Dados Pessoais (Opcionais)
    cpf: Yup.string().nullable(),
    gender: Yup.string().nullable(),

    // Endereço (Opcionais)
    zipCode: Yup.string().nullable(),
    street: Yup.string().nullable(),
    number: Yup.string().nullable(),
    neighborhood: Yup.string().nullable(),
    city: Yup.string().nullable(),
    state: Yup.string().nullable(),
    complement: Yup.string().nullable(),

    // Contato de Emergência (Opcionais)
    emergencyName: Yup.string().nullable(),
    emergencyPhone: Yup.string().nullable(),
    emergencyEmail: Yup.string().email('Email inválido').nullable(),

    // Dados de Saúde
    healthObservations: Yup.string().nullable(),

    // Status
    status: Yup.string().default('lead')
})
