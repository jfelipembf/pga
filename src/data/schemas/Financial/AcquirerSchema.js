import * as Yup from 'yup'

export const AcquirerSchema = Yup.object().shape({
    name: Yup.string().required('Nome é obrigatório'),
    // New structure for multiple rate configurations
    rateConfigs: Yup.array().of(
        Yup.object().shape({
            brands: Yup.array().of(Yup.string()).min(1, 'Selecione pelo menos uma bandeira'),
            fees: Yup.object().shape({
                debitCard: Yup.number().min(0).max(100).required('Taxa obrigatória'),
                creditCard1x: Yup.number().min(0).max(100).required('Taxa obrigatória'),
            })
        })
    ).min(1, 'Defina pelo menos uma configuração de taxas'),
    isActive: Yup.boolean().default(true),
    settlementDays: Yup.number().min(1).max(365).default(30)
        .label('Prazo de liquidação (dias)'),
    metadata: Yup.object().nullable()
})
