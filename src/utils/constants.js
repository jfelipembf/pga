
export const GENDER_OPTIONS = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Feminino' },
    { value: 'other', label: 'Outro' },
    { value: 'unspecified', label: 'Não informado' }
]

export const CLIENT_STATUS = {
    LEAD: 'lead',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended'
}

export const PAYMENT_METHODS = {
    CREDIT_CARD: 'cartao_credito',
    DEBIT_CARD: 'cartao_debito',
    PIX: 'pix',
    CASH: 'dinheiro',
    BOLETO: 'boleto',
    PENDING: 'pending_payment'
};

export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.CREDIT_CARD]: 'Cartão Crédito',
    [PAYMENT_METHODS.DEBIT_CARD]: 'Cartão Débito',
    [PAYMENT_METHODS.PIX]: 'PIX',
    [PAYMENT_METHODS.CASH]: 'Dinheiro',
    [PAYMENT_METHODS.BOLETO]: 'Boleto',
    [PAYMENT_METHODS.PENDING]: 'Saldo Devedor'
};

export const RECEIVABLE_STATUS = {
    OPEN: 'open',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
    PENDING_SETTLEMENT: 'pending_settlement'
};

export const STATUS_COLORS = {
    [RECEIVABLE_STATUS.OPEN]: 'warning',
    [RECEIVABLE_STATUS.PAID]: 'success',
    [RECEIVABLE_STATUS.OVERDUE]: 'danger',
    [RECEIVABLE_STATUS.CANCELLED]: 'secondary',
    [RECEIVABLE_STATUS.PENDING_SETTLEMENT]: 'info'
};


export const STATUS_LABELS = {
    [RECEIVABLE_STATUS.OPEN]: 'A Receber',
    [RECEIVABLE_STATUS.PAID]: 'Recebido',
    [RECEIVABLE_STATUS.OVERDUE]: 'Atrasado',
    [RECEIVABLE_STATUS.CANCELLED]: 'Cancelado',
    [RECEIVABLE_STATUS.PENDING_SETTLEMENT]: 'Pendente'
};

export const PAYABLE_STATUS = {
    OPEN: 'open',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
};

export const PAYABLE_STATUS_LABELS = {
    [PAYABLE_STATUS.OPEN]: 'A Pagar',
    [PAYABLE_STATUS.PAID]: 'Pago',
    [PAYABLE_STATUS.OVERDUE]: 'Atrasado',
    [PAYABLE_STATUS.CANCELLED]: 'Cancelado'
};

export const PAYABLE_STATUS_COLORS = {
    [PAYABLE_STATUS.OPEN]: 'warning',
    [PAYABLE_STATUS.PAID]: 'success',
    [PAYABLE_STATUS.OVERDUE]: 'danger',
    [PAYABLE_STATUS.CANCELLED]: 'secondary'
};
