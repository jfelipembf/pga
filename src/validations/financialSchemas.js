import * as Yup from 'yup';
import { PAYMENT_METHODS } from '../utils/constants';

export const cashierMovementSchema = Yup.object({
    amount: Yup.number().positive('Valor deve ser maior que zero').required('Obrigatório'),
    description: Yup.string().required('Descrição é obrigatória'),
});

export const cashierOpenSchema = Yup.object({
    openingBalance: Yup.number().min(0, 'Valor inválido').required('Obrigatório'),
});

export const cashierCloseSchema = Yup.object({
    actualBalance: Yup.number().min(0).required('Informe o valor em caixa'),
});

export const receivableSettlementSchema = Yup.object({
    settlementDate: Yup.date().required('Data obrigatória'),
    amountReceived: Yup.number().positive('Valor deve ser positivo').required('Obrigatório'),
    paymentMethod: Yup.string().required('Selecione a forma de pagamento'),
    idBankAccount: Yup.string().required('Selecione a conta de destino'),
    provider: Yup.string().when('paymentMethod', {
        is: (val) => [PAYMENT_METHODS.CREDIT_CARD, PAYMENT_METHODS.DEBIT_CARD].includes(val),
        then: (schema) => schema.required('Selecione a adquirente'),
        otherwise: (schema) => schema.nullable()
    }),
    brand: Yup.string().when('paymentMethod', {
        is: (val) => [PAYMENT_METHODS.CREDIT_CARD, PAYMENT_METHODS.DEBIT_CARD].includes(val),
        then: (schema) => schema.required('Selecione a bandeira'),
        otherwise: (schema) => schema.nullable()
    })
});

export const payablePaymentSchema = Yup.object({
    paymentDate: Yup.date().required('Data obrigatória'),
    amountPaid: Yup.number().positive('Valor deve ser positivo').required('Obrigatório'),
    paymentMethod: Yup.string().required('Selecione a forma de pagamento'),
    idBankAccount: Yup.string().required('Selecione a conta de destino')
});
