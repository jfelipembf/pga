import * as Yup from 'yup';

/**
 * Esquema de validação para Tarefas.
 */
export const TaskSchema = Yup.object().shape({
    title: Yup.string()
        .required('O título é obrigatório')
        .min(3, 'O título deve ter pelo menos 3 caracteres'),

    description: Yup.string()
        .max(1000, 'A descrição não pode exceder 1000 caracteres'),

    status: Yup.string()
        .oneOf(['pending', 'completed'], 'Status inválido')
        .default('pending'),

    priority: Yup.string()
        .oneOf(['low', 'medium', 'high'], 'Prioridade inválida')
        .default('medium'),

    dueDate: Yup.date()
        .required('A data de entrega é obrigatória')
        .nullable(),

    assignedTo: Yup.array().of(Yup.string()).min(1, 'Selecione pelo menos um responsável'),

    relatedStudents: Yup.array().of(Yup.string()).default([]),

    isRecurring: Yup.boolean()
        .default(false),

    recurrence: Yup.object().shape({
        frequency: Yup.string()
            .oneOf(['daily', 'weekly', 'monthly', 'yearly', 'none'])
            .nullable(),
        interval: Yup.number()
            .min(1, 'Mínimo 1')
            .default(1),
        daysOfWeek: Yup.array().of(Yup.number()).nullable(), // 0-6 (Sun-Sat)
        dayOfMonth: Yup.number().min(1).max(31).nullable(),
        month: Yup.number().min(0).max(11).nullable(),
        endDate: Yup.date().nullable(),
        occurrences: Yup.number().min(1).nullable(),
    }).nullable(),

    category: Yup.string().nullable(),

    estimatedTime: Yup.number().positive('Tempo deve ser positivo').nullable(),

    attachments: Yup.array().of(
        Yup.object().shape({
            name: Yup.string(),
            url: Yup.string(),
            type: Yup.string()
        })
    ).default([])
});
