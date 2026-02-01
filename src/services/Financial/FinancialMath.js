/**
 * Serviço de Matemática Financeira Pura
 * Objetivo: Realizar cálculos financeiros sem dependência de banco de dados,
 * garantindo precisão e evitando erros de arredondamento.
 */

class FinancialMathService {
    /**
     * Calcula o valor da parcela com juros simples ou compostos.
     * @param {number} amount - Valor total da venda
     * @param {number} installments - Número de parcelas
     * @param {Object} fees - Objeto de taxas da adquirente { debit: 0, credit1x: 0, credit2to6: 0... }
     * @param {string} paymentMethod - 'credit_card', 'debit_card', 'pix', etc.
     */
    calculateInstallments(amount, installments, fees, paymentMethod) {
        if (!amount || amount <= 0) return []

        const result = {
            totalAmount: amount, // Valor cobrado do cliente
            netTotal: 0,         // Valor líquido que vai cair na conta
            installments: []
        }

        let appliedFeePercent = 0

        // 1. Determinar Taxa Aplicável
        if (paymentMethod === 'debit_card') {
            appliedFeePercent = fees?.debit || 0
        } else if (paymentMethod === 'credit_card') {
            if (installments === 1) {
                appliedFeePercent = fees?.credit1x || 0
            } else if (installments >= 2 && installments <= 6) {
                appliedFeePercent = fees?.credit2to6 || 0
            } else if (installments >= 7 && installments <= 12) {
                appliedFeePercent = fees?.credit7to12 || 0
            } else {
                appliedFeePercent = fees?.credit13plus || 0
            }
        }

        // 2. Calcular Valor Líquido Total
        // Ex: R$ 100 com taxa de 5% = R$ 95 líquido
        const totalFeeValue = amount * (appliedFeePercent / 100)
        result.netTotal = amount - totalFeeValue

        // 3. Dividir em Parcelas (com tratamento de dízima)
        // Ex: R$ 100 / 3 = 33.33, 33.33, 33.34
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
                    ? (installmentGrossValue + grossDifference) * (appliedFeePercent / 100)
                    : installmentGrossValue * (appliedFeePercent / 100),
                feePercent: appliedFeePercent
            })
        }

        return result
    }

    /**
     * Calcula o reembolso proporcional de um contrato com multa
     * @param {number} totalPaid - Valor total pago pelo cliente
     * @param {number} totalDuration - Duração total (dias ou meses)
     * @param {number} usedDuration - Duração utilizada
     * @param {number} cancelFeePercent - Multa sobre o saldo restante (ex: 10%)
     */
    calculateRefund(totalPaid, totalDuration, usedDuration, cancelFeePercent) {
        if (usedDuration >= totalDuration) return { refundAmount: 0, feeAmount: 0 }

        // Valor por Unidade de Tempo
        const valuePerUnit = totalPaid / totalDuration

        // Valor Consumido
        const consumedValue = valuePerUnit * usedDuration

        // Saldo Restante (Base de Cálculo)
        const remainingBalance = totalPaid - consumedValue

        // Multa
        const feeAmount = remainingBalance * (cancelFeePercent / 100)

        // Valor a Devolver
        const refundAmount = remainingBalance - feeAmount

        return {
            totalPaid,
            consumedValue,
            remainingBalance,
            feeAmount,
            refundAmount: refundAmount > 0 ? refundAmount : 0
        }
    }
}

export const FinancialMath = new FinancialMathService()
