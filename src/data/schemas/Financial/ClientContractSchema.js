import * as Yup from 'yup'

export const ClientContractSchema = Yup.object().shape({
    idTenant: Yup.string().required(),
    idBranch: Yup.string().required(),
    idClient: Yup.string().required(),
    idSale: Yup.string().required(), // Vínculo com a venda (Transação)
    idContractTemplate: Yup.string().required(), // Vínculo com o modelo de contrato (Plano)

    title: Yup.string().required(), // Snapshot do nome para histórico

    // Datas de Vigência
    startDate: Yup.date().required(),
    endDate: Yup.date().required(),

    status: Yup.string()
        .oneOf(['active', 'expired', 'cancelled', 'financial_pending', 'future'])
        .default('active'),

    // Snapshot financeiro
    price: Yup.number().required(),

    // Regras de Acesso (Cópia para permitir customização individual se necessário futuramente)
    accessRules: Yup.object().shape({
        allowedWeekDays: Yup.array().of(Yup.string()).nullable(),
        accessLimitType: Yup.string().nullable(),
        accessLimitQuantity: Yup.number().nullable()
    }).nullable(),

    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date())
})
