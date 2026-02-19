import * as yup from "yup"

/**
 * Schema para validar fluxos de automação
 * Ex: Regra de envio de WhatsApp após aula experimental
 */
export const WorkflowSchema = yup.object().shape({
    id: yup.string(),

    // Identificação
    name: yup.string().required("O nome da automação é obrigatório"),
    description: yup.string(),
    isActive: yup.boolean().default(true),

    // Gatilho (Quando acontece?)
    trigger: yup.string().required("O gatilho (Trigger) é obrigatório")
        .oneOf([
            'EVALUATION_APPROVED',   // Avaliação Aprovada (Pedagógico)
            'TRIAL_CLASS_SCHEDULED', // Aula Experimental Agendada (Comercial)
            'TRIAL_CLASS_FINISHED',  // Aula Experimental Finalizada (Comercial)
            'PAYMENT_OVERDUE',       // Pagamento Atrasado (Financeiro)
            'BIRTHDAY_APPROACHING'   // Aniversário (Relacionamento)
        ], "Gatilho inválido"),

    // Configuração de Inteligência Artificial
    aiConfig: yup.object().shape({
        enabled: yup.boolean().default(false),
        provider: yup.string().oneOf(['openai', 'gemini']).default('openai'),
        promptTemplate: yup.string().when('enabled', {
            is: true,
            then: yup.string().required("O template do prompt é obrigatório quando a IA está ativada")
        }),
        contextFields: yup.array().of(yup.string()) // Campos do sistema para injetar (ex: ['clientName', 'levelName'])
    }),

    // Configuração do Canal de Envio
    channelConfig: yup.object().shape({
        channel: yup.string().default('whatsapp'),
        template: yup.string().required("O template da mensagem é obrigatório"), // "Olá {name}, {ai_output}"
        delayMinutes: yup.number().min(0).default(0), // Atraso no envio
    }),

    // Metadados
    createdAt: yup.date(),
    updatedAt: yup.date(),
    tenantId: yup.string().required()
})
