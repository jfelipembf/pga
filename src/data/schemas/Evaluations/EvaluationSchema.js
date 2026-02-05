import * as Yup from 'yup'

/**
 * Esquema para criação/atualização de apenas uma avaliação
 */
export const EvaluationSchema = Yup.object().shape({
    idStudent: Yup.string().required('O aluno é obrigatório'),
    idActivity: Yup.string().required('A atividade é obrigatória'),
    idLevel: Yup.string().required('O nível de avaliação é obrigatório'),

    // Opcionais contextualizam a avaliação
    idSession: Yup.string().nullable(), // Sessão específica onde ocorreu
    idClass: Yup.string().nullable(),   // Turma recorrente
    idInstructor: Yup.string().required('O avaliador é obrigatório'),

    date: Yup.string().required('A data da avaliação é obrigatória'), // YYYY-MM-DD ou ISO

    // Resultado
    status: Yup.string().oneOf(['approved', 'failed', 'pending', 'partial']).default('pending'),

    // Critérios avaliados (lista de objetos)
    criteria: Yup.array().of(
        Yup.object().shape({
            id: Yup.string().omit(['created_at', 'updated_at']),
            name: Yup.string().required(),
            score: Yup.number().min(0).max(10).nullable(), // Nota numérica ou
            achieved: Yup.boolean().nullable(),            // Checkbox (conseguiu ou não)
            comment: Yup.string()
        })
    ).nullable(),

    generalNotes: Yup.string().nullable(),

    // Campos de metadados padrão
    createdAt: Yup.any(),
    updatedAt: Yup.any(),
})
