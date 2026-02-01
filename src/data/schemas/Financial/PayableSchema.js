import * as Yup from 'yup'

export const PayableSchema = Yup.object().shape({
    expenseNumber: Yup.string().nullable(), // Gerado automaticamente (ex: D20260201-001)
    title: Yup.string().required('Descrição é obrigatória'),
    supplier: Yup.string().nullable(), // Fornecedor opcional ou obrigatório? Geralmente obrigatório para controle
    amount: Yup.number().required('Valor é obrigatório').min(0, 'Valor não pode ser negativo'),
    dueDate: Yup.date().required('Data de vencimento é obrigatória'),
    issueDate: Yup.date().default(() => new Date()),
    // Classificação Contábil
    chartOfAccountId: Yup.string().required('Plano de Contas é obrigatório'),
    chartOfAccountName: Yup.string(), // Desnormalizado para facilitar leitura

    costCenterId: Yup.string().required('Centro de Custo é obrigatório'),
    costCenterName: Yup.string(), // Desnormalizado para facilitar leitura

    status: Yup.string()
        .oneOf(['open', 'pending', 'paid', 'overdue', 'cancelled'])
        .default('open'),

    // Dados de Pagamento (Se pago)
    paymentDate: Yup.date().nullable(),
    paymentMethod: Yup.string().nullable(),
    documentNumber: Yup.string().nullable(),
    idBankAccount: Yup.string().nullable(),

    // Auditoria
    createdBy: Yup.string().nullable(),

    // Metadados
    notes: Yup.string().nullable(),
    installments: Yup.object().shape({
        current: Yup.number(),
        total: Yup.number(),
        parentId: Yup.string().nullable() // ID da conta "pai" se for parcelado
    }).nullable(),

    attachments: Yup.array().of(Yup.string()).nullable() // URLs de arquivos
})
