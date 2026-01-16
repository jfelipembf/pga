export const formatCurrency = value =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))

export const renderMethod = method => {
    if (!method) return "-"
    switch (method.type) {
        case "dinheiro":
            return "Dinheiro"
        case "pix":
            return "Pix"
        case "boleto":
            return "Boleto"
        case "cartao":
            return `${method.brand || "Cartão"} • ${method.installments || 1}x • Aut: ${method.authorizationCode || "-"
                } • Adq: ${method.acquirer || "-"}`
        case "credito_interno":
            return "Crédito interno"
        default:
            return method.type
    }
}

export const calculateFinancialSummary = (financial) => {
    // Total Movimentado = Soma de valores positivos (Compras/Serviços)
    const total = financial
        .filter(f => Number(f.amount || 0) > 0)
        .reduce((acc, cur) => acc + Number(cur.amount || 0), 0)

    // Saldo Devedor = Soma de pendências (já tratadas no service)
    const debt = financial
        .filter(f => Number(f.pending || 0) > 0)
        .reduce((acc, cur) => acc + Number(cur.pending || 0), 0)

    // Créditos = Valores negativos que NÃO são pagamento de dívida (receivablePayment)
    const credit = financial
        .filter(f => Number(f.amount || 0) < 0 && f.type !== 'receivablePayment')
        .reduce((acc, cur) => acc + Number(cur.amount || 0), 0)

    return [
        { id: "total-spent", label: "Total movimentado", value: total, color: "primary" },
        { id: "open-balance", label: "Saldo devedor", value: debt, color: "danger" },
        { id: "credits", label: "Créditos", value: Math.abs(credit), color: "success" },
    ]
}
