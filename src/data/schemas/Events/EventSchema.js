import * as yup from 'yup'

/**
 * Schema para Eventos (Avaliações, Provas, etc.)
 */
export const EventSchema = yup.object().shape({
    name: yup.string().required('O nome do evento é obrigatório'),
    type: yup.string()
        .oneOf(['evaluation', 'test', 'other'])
        .required('O tipo de evento é obrigatório'),

    startDate: yup.string().required('A data de início é obrigatória'),
    endDate: yup.string().required('A data de fim é obrigatória'),

    status: yup.string()
        .oneOf(['active', 'finished', 'draft'])
        .default('active'),

    // Configuração específica para Testes (Time vs Distance)
    testConfig: yup.object().when('type', {
        is: 'test',
        then: () => yup.object().shape({
            measureType: yup.string()
                .oneOf(['distance', 'time'])
                .required('O tipo de medida (Tempo ou Distância) é obrigatório'),
            referenceValue: yup.number()
                .required('O valor de referência é obrigatório'), // Ex: 60 (min) ou 500 (metros)
            unit: yup.string().required('A unidade de medida é obrigatória'), // Ex: 'm', 'min', 'km'
        }),
        otherwise: () => yup.object().nullable()
    }),

    description: yup.string().nullable(),
    createdAt: yup.mixed(),
    updatedAt: yup.mixed(),
    createdBy: yup.string().nullable()
})
