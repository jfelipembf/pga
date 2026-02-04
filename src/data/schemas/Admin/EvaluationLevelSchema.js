import * as yup from 'yup'

/**
 * Schema de validação para Níveis de Avaliação
 */
export const EvaluationLevelSchema = yup.object().shape({
    title: yup
        .string()
        .required('Título é obrigatório')
        .min(2, 'Título deve ter no mínimo 2 caracteres')
        .max(100, 'Título deve ter no máximo 100 caracteres'),
    
    value: yup
        .number()
        .required('Valor é obrigatório')
        .min(0, 'Valor deve ser maior ou igual a 0')
        .max(10, 'Valor deve ser menor ou igual a 10'),
    
    order: yup
        .number()
        .required('Ordem é obrigatória')
        .min(0, 'Ordem deve ser maior ou igual a 0'),
    
    isActive: yup
        .boolean()
        .default(true),
    
    status: yup
        .string()
        .oneOf(['active', 'inactive', 'deleted'])
        .default('active'),
    
    metadata: yup
        .object()
        .nullable()
})
