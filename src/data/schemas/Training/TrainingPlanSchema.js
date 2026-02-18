import * as Yup from 'yup';

export const TrainingPlanSchema = Yup.object().shape({
    description: Yup.string().optional(),
    dateString: Yup.string().required('A data é obrigatória'),
    totalDistance: Yup.number().transform((val) => (isNaN(val) ? 0 : val)).min(0).default(0),

    // Contexto do treino
    modality: Yup.string().nullable(),
    phase: Yup.string().nullable(),
    objective: Yup.string().nullable(),
    targetDistance: Yup.string().nullable(),

    // Configuração da sessão
    poolId: Yup.string().nullable(),
    poolName: Yup.string().nullable(),
    poolLength: Yup.number().nullable(),
    sessionDuration: Yup.number().nullable(),

    sections: Yup.array().of(
        Yup.object().shape({
            id: Yup.mixed().required(),
            name: Yup.string().optional(),
            items: Yup.array().of(
                Yup.object().shape({
                    id: Yup.mixed().required(),
                    reps: Yup.number().transform((val) => (isNaN(val) ? 1 : val)).min(1).required('Número de repetições é obrigatório'),
                    exercise: Yup.string().optional(),
                    distance: Yup.number().transform((val) => (isNaN(val) ? 0 : val)).min(0).required('A distância é obrigatória'),
                    style: Yup.mixed().nullable(),
                    intensity: Yup.mixed().nullable(),
                    equipment: Yup.array().optional(),
                    interval: Yup.string().optional(),
                    observation: Yup.string().optional()
                })
            ).min(1, 'Adicione pelo menos uma série na seção')
        })
    ).min(1, 'Adicione pelo menos uma seção ao treino'),
    status: Yup.string().oneOf(['draft', 'published', 'completed']).default('published')
});
