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
