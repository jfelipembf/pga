export const CASHIER_REPORT_INFO = {
    consultant: {
        name: "Carlos Almeida",
        role: "Consultor Financeiro",
        document: "CPF 123.456.789-00",
    },
    responsible: {
        name: "Patrícia Martins",
        role: "Gerente de Unidade",
    },
    branch: "Unidade Paulista",
    generatedAt: "04/01/2026 10:20",
}

export const CASHIER_SUMMARY = [
    { id: "incomes", label: "Entradas", value: 12450.75, color: "success" },
    { id: "expenses", label: "Saídas", value: 4820.4, color: "danger" },
    { id: "result", label: "Resultado", value: 7620.35, color: "primary" },
]

export const CASHIER_TRANSACTIONS = [
    {
        id: "ENT-2345",
        type: "Entrada",
        category: "Mensalidade",
        description: "Plano Gold - João Lima",
        amount: 299.9,
        method: "Cartão",
        hour: "08:12",
    },
    {
        id: "ENT-2346",
        type: "Entrada",
        category: "Loja",
        description: "Compra de suplementos",
        amount: 180.0,
        method: "Pix",
        hour: "08:25",
    },
    {
        id: "SAI-1290",
        type: "Saída",
        category: "Despesa",
        description: "Troco - abertura",
        amount: 200.0,
        method: "Dinheiro",
        hour: "08:40",
    },
    {
        id: "ENT-2347",
        type: "Entrada",
        category: "Mensalidade",
        description: "Plano Smart - Aline Costa",
        amount: 199.9,
        method: "Cartão",
        hour: "09:05",
    },
    {
        id: "SAI-1291",
        type: "Saída",
        category: "Despesa",
        description: "Serviço de limpeza",
        amount: 150.0,
        method: "Pix",
        hour: "09:20",
    },
]
