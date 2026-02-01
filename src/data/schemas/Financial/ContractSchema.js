import * as Yup from 'yup'

export const ContractSchema = Yup.object().shape({
    // IDENTIFICAÇÃO
    title: Yup.string()
        .required('O nome interno do contrato é obrigatório')
        .min(3, 'Nome muito curto'),

    isActive: Yup.boolean()
        .default(true),

    // DURAÇÃO
    duration: Yup.number()
        .required('Duração é obrigatória')
        .min(1, 'Duração mínima deve ser 1')
        .integer('Use números inteiros'),

    durationType: Yup.string()
        .oneOf(['days', 'months', 'years'], 'Tipo inválido')
        .default('months')
        .required('Categoria de duração é obrigatória'),

    minPermanence: Yup.number()
        .min(0, 'Permanência mínima não pode ser negativa')
        .integer()
        .default(0)
        .nullable(),


    // REGRAS DE ACESSO (ACCESS CONTROL)
    accessLimitType: Yup.string()
        .oneOf(['unlimited', 'total', 'weekly', 'monthly'], 'Tipo de limite inválido')
        .default('unlimited'), // Ilimitado, Quantidade Total, Semanal, Mensal

    accessLimitQuantity: Yup.number()
        .transform((value, originalValue) => {
            return (originalValue === "" || originalValue === null) ? null : value;
        })
        .nullable()
        .when('accessLimitType', {
            is: (val) => val !== 'unlimited',
            then: () => Yup.number().typeError("Deve ser um número").min(1, 'Quantidade deve ser maior que zero').required('Quantidade é obrigatória'),
            otherwise: () => Yup.mixed().nullable().notRequired()
        }),

    unlimitedInOrigin: Yup.boolean()
        .default(true), // Acessos ilimitados na unidade de origem?

    allowedBranches: Yup.array()
        .of(Yup.string()) // IDs das unidades permitidas
        .default([]), // Vazio = Apenas unidade de origem (ou todas? Definir regra de negócio. Geralmente vazio = origem)

    allowedWeekDays: Yup.array()
        .of(Yup.string().oneOf(['0', '1', '2', '3', '4', '5', '6']))
        .nullable()
        .default([]), // Vazio = Todos os dias permitidos

    // VALORES
    price: Yup.number()
        .required('Valor padrão é obrigatório')
        .min(0.01, 'O valor deve ser maior que zero'),

    maxInstallments: Yup.number()
        .required('Número máximo de parcelas é obrigatório')
        .min(1, 'Mínimo de 1 parcela')
        .max(120, 'Máximo razoável excedido')
        .integer(),

    // SUSPENSÃO (CONGELAMENTO)
    allowFreeze: Yup.boolean()
        .default(true),

    maxFreezeDays: Yup.number()
        .when('allowFreeze', {
            is: true,
            then: () => Yup.number()
                .required('Defina o máximo de dias de suspensão')
                .min(1, 'Mínimo de 1 dia')
                .default(30),
            otherwise: () => Yup.number().default(0).nullable()
        }),

    // METADATA
    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date()),
    deleted: Yup.boolean().default(false)
})

export const contractInitialValues = {
    title: '',
    isActive: true,
    duration: 12,
    durationType: 'months',
    minPermanence: 0,
    allowedWeekDays: [],
    accessLimitType: 'unlimited',
    accessLimitQuantity: null,
    unlimitedInOrigin: true,
    allowedBranches: [],
    price: '',
    maxInstallments: 12,
    allowFreeze: true,
    maxFreezeDays: 30
}
