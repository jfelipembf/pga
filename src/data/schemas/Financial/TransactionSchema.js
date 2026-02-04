import * as Yup from 'yup'

export const TransactionSchema = Yup.object().shape({
    type: Yup.string().oneOf(['income', 'expense']).required(),
    date: Yup.date().required(),
    amount: Yup.number().required(),
    netAmount: Yup.number().required(),
    category: Yup.string().required(),
    method: Yup.string().required(),
    description: Yup.string().required(),
    idCashierSession: Yup.string().nullable(),
    idSale: Yup.string().nullable(),
    saleNumber: Yup.string().nullable(),
    clientName: Yup.string().nullable(), // Nome do cliente para identificação rápida
    createdBy: Yup.string().nullable(), // ID do usuário que gerou
    userName: Yup.string().nullable(), // Nome do usuário que gerou
    idReceivable: Yup.string().nullable(),
    status: Yup.string().default('completed')
})
