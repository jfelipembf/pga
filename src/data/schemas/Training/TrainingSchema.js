import * as yup from 'yup';

export const TrainingSchema = yup.object().shape({
    name: yup.string().required('Nome do treino é obrigatório'),
    description: yup.string().nullable(),
    dateString: yup.string().required('Data é obrigatória'),
    totalDistance: yup.number().nullable(),
    sections: yup.array().of(
        yup.object().shape({
            id: yup.number().required(),
            name: yup.string().required('Nome da seção é obrigatório'),
            items: yup.array().of(
                yup.object().shape({
                    id: yup.number().required(),
                    exercise: yup.string().nullable(),
                    reps: yup.string().nullable(),
                    distance: yup.number().nullable(),
                    intensity: yup.string().nullable(),
                    equipment: yup.array().of(yup.string()).nullable(),
                    interval: yup.string().nullable(),
                    style: yup.string().nullable(),
                    observation: yup.string().nullable(),
                })
            )
        })
    )
});
