import * as yup from 'yup'

/**
 * Schema para Resultados de Testes (Provas de tempo/distância)
 */
export const TestResultSchema = yup.object().shape({
    idStudent: yup.string().required('O aluno é obrigatório'),
    idActivity: yup.string().required('A atividade é obrigatória'),
    idEvent: yup.string().required('O evento (ciclo) é obrigatório'),
    idInstructor: yup.string().required('O instrutor é obrigatório'),
    date: yup.string().required('A data é obrigatória'),

    // Dados do Teste (Dependem do tipo configurado no Evento)
    type: yup.string().oneOf(['fixed-time', 'fixed-distance']).required(),

    // Se type == 'fixed-time' (tempo fixo, medimos distância), o valor é em metros/km
    resultDistance: yup.number().when('type', {
        is: 'fixed-time',
        then: () => yup.number().required('A distância atingida é obrigatória'),
        otherwise: () => yup.number().nullable()
    }),

    // Se type == 'fixed-distance' (distância fixa, medimos tempo), o valor é em segundos/minutos
    resultTime: yup.string().when('type', {
        is: 'fixed-distance',
        then: () => yup.string().required('o tempo de conclusão é obrigatório'),
        otherwise: () => yup.string().nullable()
    }),

    notes: yup.string().nullable(),
    createdAt: yup.mixed(),
    updatedAt: yup.mixed(),
})
