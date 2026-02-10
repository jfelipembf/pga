import { PAYMENT_METHODS } from '../../../utils/constants'
import * as Yup from 'yup'

export const TransactionSchema = Yup.object().shape({
    type: Yup.string().oneOf(['income', 'expense']).required(),
    date: Yup.date().required(),
    amount: Yup.number().positive().required(),
    netAmount: Yup.number().required(), // Pode ser 0 ou negativo em ajustes contábeis, mas geralmente positivo
    category: Yup.string().required(),
    method: Yup.string().oneOf(Object.values(PAYMENT_METHODS)).required(),
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
