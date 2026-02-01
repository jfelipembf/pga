import * as Yup from 'yup'

export const BankAccountSchema = Yup.object().shape({
    name: Yup.string().required('Nome da conta é obrigatório'),
    bank: Yup.string().required('Nome do banco é obrigatório'),
    bankCode: Yup.string().required('Código do banco é obrigatório'),
    agency: Yup.string().required('Agência é obrigatória'),
    account: Yup.string().required('Conta é obrigatória'),
    accountType: Yup.string().oneOf(['checking', 'savings'], 'Tipo inválido').required('Tipo é obrigatório'),
    isActive: Yup.boolean().default(true),
    isPrimary: Yup.boolean().default(false),
    currentBalance: Yup.number().default(0),
    metadata: Yup.object().nullable()
})
