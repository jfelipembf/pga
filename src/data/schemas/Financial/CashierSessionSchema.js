import * as Yup from 'yup'

export const CashierSessionSchema = Yup.object().shape({
    openedAt: Yup.date().default(() => new Date()),
    openingBalance: Yup.number().min(0).required('Saldo inicial é obrigatório'),
    idUser: Yup.string().required(),
    userName: Yup.string().required(),
    status: Yup.string().oneOf(['open', 'closed']).default('open'),
    openingNotes: Yup.string().nullable(),
    totalIncome: Yup.number().default(0),
    totalExpenses: Yup.number().default(0),
    expectedBalance: Yup.number().default(0)
})

export const CashierOpenSchema = Yup.object({
    openingBalance: Yup.number().min(0, 'Valor inválido').required('Obrigatório'),
});

export const CashierCloseSchema = Yup.object({
    actualBalance: Yup.number().min(0).required('Informe o valor em caixa'),
});

export const CashierMovementSchema = Yup.object({
    amount: Yup.number().positive('Valor deve ser maior que zero').required('Obrigatório'),
    description: Yup.string().required('Descrição é obrigatória'),
});
