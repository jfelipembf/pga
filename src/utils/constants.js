
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
    SUSPENDED: 'suspended'
};

export const CLIENT_CONTRACT_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    CANCELLED: 'cancelled',
    SCHEDULED_CANCELLATION: 'scheduled_cancellation'
};

export const LIFECYCLE_STATUS = {
    LEAD: 'lead',
    SCHEDULED: 'scheduled',
    ATTENDED: 'attended',
    WAITING: 'waiting',
    NEGOTIATION: 'negotiation',
    LOST: 'lost',
    CONVERTED: 'converted'

};

export const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    PIX: 'pix',
    CASH: 'money',
    BOLETO: 'bank_slip',
    PENDING: 'pending_payment',
    TRANSFER: 'transfer',
    CORPORATE_CARD: 'corporate_card',
    CHECK: 'check'
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
export const STUDENT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPERIMENT: 'experiment',
    PENDING: 'pending'
}

export const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    EDITING: 'editing'
}

export const ATTENDANCE_STATUS_LABELS = {
    [ATTENDANCE_STATUS.PRESENT]: 'Presente',
    [ATTENDANCE_STATUS.ABSENT]: 'Faltou',
    [ATTENDANCE_STATUS.EDITING]: 'Editando'
}

export const WEEKDAYS = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
}

export const WEEKDAY_LABELS = {
    [WEEKDAYS.SUNDAY]: 'Domingo',
    [WEEKDAYS.MONDAY]: 'Segunda-feira',
    [WEEKDAYS.TUESDAY]: 'Terça-feira',
    [WEEKDAYS.WEDNESDAY]: 'Quarta-feira',
    [WEEKDAYS.THURSDAY]: 'Quinta-feira',
    [WEEKDAYS.FRIDAY]: 'Sexta-feira',
    [WEEKDAYS.SATURDAY]: 'Sábado'
}

export const WEEKDAY_SHORT_LABELS = {
    [WEEKDAYS.SUNDAY]: 'Dom',
    [WEEKDAYS.MONDAY]: 'Seg',
    [WEEKDAYS.TUESDAY]: 'Ter',
    [WEEKDAYS.WEDNESDAY]: 'Qua',
    [WEEKDAYS.THURSDAY]: 'Qui',
    [WEEKDAYS.FRIDAY]: 'Sex',
    [WEEKDAYS.SATURDAY]: 'Sáb'
}

export const WEEKDAY_OPTIONS = [
    { value: WEEKDAYS.SUNDAY, label: 'Domingo' },
    { value: WEEKDAYS.MONDAY, label: 'Segunda' },
    { value: WEEKDAYS.TUESDAY, label: 'Terça' },
    { value: WEEKDAYS.WEDNESDAY, label: 'Quarta' },
    { value: WEEKDAYS.THURSDAY, label: 'Quinta' },
    { value: WEEKDAYS.FRIDAY, label: 'Sexta' },
    { value: WEEKDAYS.SATURDAY, label: 'Sábado' }
]

export const MONTHS = [
    { value: 0, label: "Janeiro" },
    { value: 1, label: "Fevereiro" },
    { value: 2, label: "Março" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Maio" },
    { value: 5, label: "Junho" },
    { value: 6, label: "Julho" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Setembro" },
    { value: 9, label: "Outubro" },
    { value: 10, label: "Novembro" },
    { value: 11, label: "Dezembro" }
];

export const MONTH_LABELS = MONTHS.map(m => m.label);
export const MONTH_SHORT_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const BANK_OPTIONS = [
    { value: '341', label: '341 - Itaú Unibanco' },
    { value: '001', label: '001 - Banco do Brasil' },
    { value: '237', label: '237 - Bradesco' },
    { value: '033', label: '033 - Santander' },
    { value: '104', label: '104 - Caixa Econômica' },
    { value: '260', label: '260 - Nubank' },
    { value: '077', label: '077 - Inter' },
    { value: '999', label: '999 - Outro Banco' }
];

export const BANK_NAMES = {
    '341': 'Itaú Unibanco',
    '001': 'Banco do Brasil',
    '237': 'Bradesco',
    '033': 'Santander',
    '104': 'Caixa Econômica',
    '260': 'Nubank',
    '077': 'Inter'
};
