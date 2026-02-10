import * as Yup from 'yup'

/**
 * Schema para Contas a Receber (Receivables)
 * Representa um título financeiro que a empresa deve receber.
 * 
 * MODELO CONTÁBIL:
 * - type: 'acquirer' = Recebível de adquirente (risco ZERO - garantido)
 * - type: 'client' = Recebível do cliente (risco ALTO - inadimplência possível)
 */
export const ReceivableSchema = Yup.object().shape({
    // Identificação
    idSale: Yup.string().nullable(),
    saleNumber: Yup.string().nullable(), // ID amigável (ex: V20250131-143025)
    idClient: Yup.string().required('Cliente é obrigatório'),
    clientName: Yup.string().required(),

    // Tipo de Recebível (DIFERENCIAÇÃO DE RISCO)
    type: Yup.string()
        .oneOf(['acquirer', 'client'])
        .default('client')
        .required('Tipo de recebível é obrigatório'),

    // Parcelas (para rastreamento)
    installmentNumber: Yup.number().min(1).default(1),
    totalInstallments: Yup.number().min(1).default(1),

    // Valores Financeiros
    grossAmount: Yup.number().min(0).nullable(), // Valor bruto original
    feeAmount: Yup.number().min(0).default(0),   // Valor da taxa (MDR)
    netAmount: Yup.number().min(0).nullable(),   // Valor líquido a receber
    amount: Yup.number().positive('O valor deve ser positivo').required('Valor é obrigatório'),
    paid: Yup.number().min(0).default(0),
    pending: Yup.number().min(0).required(),

    // Datas
    dueDate: Yup.date().required('Data de vencimento é obrigatória'),
    settlementDate: Yup.date().nullable(), // Quando efetivamente foi pago
    paidAt: Yup.date().nullable(),

    // Método e Status
    paymentMethod: Yup.string()
        .oneOf(['money', 'pix', 'debit_card', 'credit_card', 'pending_payment', 'bank_slip'])
        .required('Método de pagamento é obrigatório'),
    status: Yup.string()
        .oneOf(['open', 'paid', 'cancelled', 'pending_settlement', 'overdue'])
        .default('open'),

    // Informações de Cartão
    idAcquirer: Yup.string().nullable(),  // ID da adquirente
    provider: Yup.string().nullable(),     // Nome da adquirente (ex: Stone)
    brand: Yup.string().nullable(),        // Bandeira (ex: Visa)
    authCode: Yup.string().nullable(),     // Código de autorização

    description: Yup.string().nullable(),
    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date())
})
