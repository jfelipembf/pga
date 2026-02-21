/**
 * FinancialCalculator: Core Business Logic for Financial Computations
 * 
 * Responsável por centralizar regras de cálculo financeiro, status e totalização.
 * NÃO deve conter lógica de persistência (DB calls), apenas transformações de dados.
 */

export const FinancialCalculator = {
    /**
     * Calcula o Resumo Financeiro de um Cliente.
     * Recebe listas puras de Vendas (sales) e Recebíveis (receivables).
     */
    calculateClientSummary: (sales = [], receivables = []) => {
        const summary = {
            totalSubtotal: 0,      // Volume Bruto (Sem descontos)
            totalOwed: 0,          // Volume Líquido (Com descontos) da VENDA
            totalPaid: 0,          // LTV Real (Já recebido efetivamente de qualquer fonte válida)
            totalPending: 0,       // Saldo Devedor do Cliente (Tipo 'client')
            totalOverdue: 0,       // Débito Vencido do Cliente (Tipo 'client')
            totalBankReceivable: 0,// A Receber das Adquirentes (Tipo 'acquirer')
            totalDiscount: 0,      // Total de descontos concedidos
            receivablesCount: receivables.length
        };

        const now = new Date();

        // 1. Processar Volume de Vendas (Compromissos Financeiros)
        sales.forEach(sale => {
            if (sale.deletedAt) return; // Ignora excluídos (Soft Delete)

            const subtotal = parseFloat(sale.subtotal) || (parseFloat(sale.total) + (parseFloat(sale.discount) || 0));
            const total = parseFloat(sale.total) || 0;
            const paidAtSale = parseFloat(sale.totalPaid) || 0;
            const discountAmount = parseFloat(sale.discount) || 0;

            summary.totalSubtotal += subtotal;
            summary.totalOwed += total;
            summary.totalPaid += paidAtSale; // Cash/Pix/Card já contabilizado na venda (Entrada)
            summary.totalDiscount += discountAmount;
        });

        // 2. Processar Títulos (Parcelas e Recebíveis Futuros)
        receivables.forEach(rec => {
            if (rec.deletedAt || rec.status === 'cancelled') return;

            const amount = parseFloat(rec.amount) || 0;
            const paid = parseFloat(rec.paid) || 0;
            const pending = Math.max(0, amount - paid);

            // Títulos a Receber do Cliente (Boletos, Promissórias, Carnês)
            if (rec.type === 'client' || rec.paymentMethod === 'pending_payment') {
                summary.totalPaid += paid; // O que ele JÁ pagou dessas parcelas entra no LTV
                summary.totalPending += pending; // O que FALTA pagar entra no Saldo Devedor

                // Verificação de Vencimento
                let dueDate = null;
                if (rec.dueDate) {
                    dueDate = typeof rec.dueDate.toDate === 'function' ? rec.dueDate.toDate() : new Date(rec.dueDate);
                }

                if (rec.status === 'open' && dueDate && dueDate < now) {
                    summary.totalOverdue += pending;
                }
            }
            // Títulos de Cartão (Adquirentes)
            else if (rec.type === 'acquirer') {
                // Dinheiro que o cliente já pagou (no cartão), mas o banco ainda deve repassar
                summary.totalBankReceivable += pending;
                // NOTA: Não somamos 'paid' aqui no LTV porque o valor integral da venda no cartão já entrou via 'paidAtSale' no passo 1.
            }
        });

        return summary;
    },

    /**
    * Valida a integridade financeira de uma venda (Totais vs Itens vs Pagamentos).
    * Retorna objeto com { isValid, errors: [] }
    */
    validateSaleIntegrity: (saleData) => {
        const errors = [];
        const subtotal = parseFloat(saleData.subtotal) || 0;
        const discount = parseFloat(saleData.discount) || 0;
        const total = parseFloat(saleData.total) || 0;
        const balance = parseFloat(saleData.balance) || 0;

        // Regra 1: Subtotal - Desconto == Total
        if (Math.abs((subtotal - discount) - total) > 0.01) {
            errors.push(`Inconsistência de Totais: Subtotal (${subtotal}) - Desconto (${discount}) != Total (${total})`);
        }

        // Regra 2: Total == Pagamentos + Saldo Devedor
        const paymentsTotal = (saleData.payments || []).reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
        if (Math.abs((paymentsTotal + balance) - total) > 0.01) {
            errors.push(`Inconsistência de Pagamento: Pagos (${paymentsTotal}) + Saldo (${balance}) != Total (${total})`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Calcula o desconto proporcional para um item baseado no total da venda.
     */
    calculateProportionalDiscount: (unitPrice, subtotal, total) => {
        const originalPrice = parseFloat(unitPrice) || 0;
        const sub = parseFloat(subtotal) || 0;
        const tot = parseFloat(total) || 0;

        const discountFactor = sub > 0 ? (tot / sub) : 1;
        const netPrice = originalPrice * discountFactor;
        const discountValue = originalPrice - netPrice;

        return {
            netPrice,
            discountValue
        };
    },

    // =========================================================================
    // MÓDULO DE MATEMÁTICA FINANCEIRA (Puro e Agnóstico)
    // =========================================================================

    /**
     * Calcula as parcelas de uma venda com juros e taxas.
     * Focada apenas na matemática da divisão e arredondamento.
     */
    calculateInstallments: (amount, installments, feePercent = 0) => {
        if (!amount || amount <= 0) return []

        const result = {
            totalAmount: amount, // Valor cobrado do cliente
            netTotal: 0,         // Valor líquido que vai cair na conta
            installments: []
        }

        // 1. Calcular Valor Líquido Total
        const totalFeeValue = amount * (feePercent / 100)
        result.netTotal = amount - totalFeeValue

        // 2. Dividir em Parcelas (com tratamento de dízima)
        const installmentGrossValue = Math.floor((amount / installments) * 100) / 100
        const installmentNetValue = Math.floor((result.netTotal / installments) * 100) / 100

        // Ajuste da diferença de centavos na última parcela
        const grossDifference = amount - (installmentGrossValue * installments)
        const netDifference = result.netTotal - (installmentNetValue * installments)

        for (let i = 1; i <= installments; i++) {
            const isLast = i === installments
            result.installments.push({
                number: i,
                grossAmount: isLast ? installmentGrossValue + grossDifference : installmentGrossValue,
                netAmount: isLast ? installmentNetValue + netDifference : installmentNetValue,
                feeAmount: isLast
                    ? (installmentGrossValue + grossDifference) * (feePercent / 100)
                    : installmentGrossValue * (feePercent / 100),
                feePercent: feePercent
            })
        }

        return result
    }
};
