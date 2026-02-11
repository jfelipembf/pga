import * as Yup from 'yup'

const SaleItemSchema = Yup.object().shape({
    type: Yup.string().oneOf(['contract', 'product', 'service']).required(),
    idItem: Yup.string().required(),
    name: Yup.string().required(),
    quantity: Yup.number().min(1).required(),
    unitPrice: Yup.number().min(0).required(),
    totalPrice: Yup.number().min(0).required()
})

const SalePaymentSchema = Yup.object().shape({
    methodId: Yup.string().oneOf(['money', 'pix', 'debit_card', 'credit_card']).required(),
    methodLabel: Yup.string().required(),
    value: Yup.number().positive().required(),
    installments: Yup.number().min(1).default(1),
    idAcquirer: Yup.string().nullable(), // ID Adquirente
    provider: Yup.string().nullable(), // Nome Adquirente
    brand: Yup.string().nullable(),    // Bandeira
    auth: Yup.string().nullable()      // Código de autorização
})

export const SaleSchema = Yup.object().shape({
    saleDate: Yup.date().required('Data da venda é obrigatória'),
    saleNumber: Yup.string().nullable(), // ID amigável (ex: V20250131-001)
    idClient: Yup.string().required('Cliente é obrigatório'),
    clientName: Yup.string().required(),
    idSeller: Yup.string().required('Vendedor é obrigatório'),
    sellerName: Yup.string().required(),
    items: Yup.array().of(SaleItemSchema).min(1, 'Adicione pelo menos um item'),
    payments: Yup.array().of(SalePaymentSchema),
    subtotal: Yup.number().min(0).required(),
    discount: Yup.number().min(0).default(0),
    total: Yup.number().min(0).required(),
    totalPaid: Yup.number().min(0).required(),
    balance: Yup.number().min(0).required(), // Saldo a pagar (Recebível)
    dueDateBalance: Yup.date().nullable().when('balance', {
        is: (val) => val > 0,
        then: () => Yup.date().required('Defina a data para o pagamento do saldo restante'),
        otherwise: () => Yup.date().nullable()
    }),
    status: Yup.string().oneOf(['draft', 'completed', 'cancelled', 'partial', 'paid', 'open']).default('completed'),
    idCashierSession: Yup.string().nullable(),
    metadata: Yup.object().nullable()
})

