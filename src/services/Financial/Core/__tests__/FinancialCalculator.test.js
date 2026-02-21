import { FinancialCalculator } from '../FinancialCalculator';

describe('FinancialCalculator', () => {

    // ==========================================
    // calculateClientSummary
    // ==========================================
    describe('calculateClientSummary', () => {
        it('deve calcular corretamente um sumário vazio', () => {
            const summary = FinancialCalculator.calculateClientSummary([], []);
            expect(summary).toEqual({
                totalSubtotal: 0,
                totalOwed: 0,
                totalPaid: 0,
                totalPending: 0,
                totalOverdue: 0,
                totalBankReceivable: 0,
                totalDiscount: 0,
                receivablesCount: 0
            });
        });

        it('deve calcular corretamente o sumário com vendas e recebíveis', () => {
            const sales = [
                { id: 's1', subtotal: 100, discount: 10, total: 90, totalPaid: 90 }, // Venda paga na hora
                { id: 's2', subtotal: 200, discount: 0, total: 200, totalPaid: 50 },  // Venda parcial
                { id: 's3', subtotal: 50, discount: 0, total: 50, totalPaid: 0, deletedAt: '2025-01-01' } // Venda excluída
            ];

            // Para os recebíveis gerados pela venda 2
            const now = new Date();
            const pastDate = new Date();
            pastDate.setDate(now.getDate() - 10); // 10 dias atrasados
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + 10); // 10 dias no futuro

            const receivables = [
                // Cliente - Boleto/Pix
                { id: 'r1', type: 'client', amount: 50, paid: 50, status: 'paid' },
                { id: 'r2', type: 'client', amount: 50, paid: 0, status: 'open', dueDate: pastDate }, // Atrasado
                { id: 'r3', type: 'client', amount: 50, paid: 0, status: 'open', dueDate: futureDate }, // Pendente no prazo
                // Adquirente - Cartão (Dinheiro a receber do banco)
                { id: 'r4', type: 'acquirer', amount: 100, paid: 0, status: 'open' },
                // Cancelado
                { id: 'r5', type: 'client', amount: 10, paid: 0, status: 'cancelled' }
            ];

            const summary = FinancialCalculator.calculateClientSummary(sales, receivables);

            expect(summary.totalSubtotal).toBe(300); // 100 + 200
            expect(summary.totalDiscount).toBe(10);
            expect(summary.totalOwed).toBe(290); // 90 + 200

            // Total paid = (Paid at sale) + (Paid from client receivables)
            // Paid at sale = 90 + 50 = 140
            // Paid from rec = 50 (r1)
            // Total = 190
            expect(summary.totalPaid).toBe(190);

            // Pending = r2 (50) + r3 (50) = 100
            expect(summary.totalPending).toBe(100);

            // Overdue = r2 = 50
            expect(summary.totalOverdue).toBe(50);

            // Bank receivable = r4 = 100
            expect(summary.totalBankReceivable).toBe(100);
        });
    });

    // ==========================================
    // validateSaleIntegrity
    // ==========================================
    describe('validateSaleIntegrity', () => {
        it('deve retornar válido para uma venda consistente', () => {
            const sale = {
                subtotal: 100,
                discount: 10,
                total: 90,
                balance: 40,
                payments: [{ value: 50 }]
            };
            const result = FinancialCalculator.validateSaleIntegrity(sale);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('deve identificar inconsistência no total vs subtotal - desconto', () => {
            const sale = {
                subtotal: 100,
                discount: 10,
                total: 80, // Inconsistente (100 - 10 = 90)
                balance: 30, // 80 - 50 = 30
                payments: [{ value: 50 }]
            };
            const result = FinancialCalculator.validateSaleIntegrity(sale);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Inconsistência de Totais');
        });

        it('deve identificar inconsistência no pagamento vs saldo', () => {
            const sale = {
                subtotal: 100,
                discount: 10,
                total: 90,
                balance: 30, // Inconsistente (pagou 50, falta 40)
                payments: [{ value: 50 }]
            };
            const result = FinancialCalculator.validateSaleIntegrity(sale);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Inconsistência de Pagamento');
        });
    });

    // ==========================================
    // calculateProportionalDiscount
    // ==========================================
    describe('calculateProportionalDiscount', () => {
        it('deve aplicar desconto proporcional em um item', () => {
            // Venda: Subtotal 200, Total 180 (10% de desconto)
            const result = FinancialCalculator.calculateProportionalDiscount(50, 200, 180);
            expect(result.netPrice).toBe(45); // 50 * 0.9
            expect(result.discountValue).toBe(5);
        });

        it('deve lidar correamente com desconto total (total = 0)', () => {
            // Venda: Subtotal 100, Total 0 (100% de desconto)
            const result = FinancialCalculator.calculateProportionalDiscount(20, 100, 0);
            expect(result.netPrice).toBe(0);
            expect(result.discountValue).toBe(20);
        });

        it('deve lidar corretamente com venda de subtotal zero', () => {
            const result = FinancialCalculator.calculateProportionalDiscount(0, 0, 0);
            expect(result.netPrice).toBe(0);
            expect(result.discountValue).toBe(0);
        });
    });

    // ==========================================
    // calculateInstallments
    // ==========================================
    describe('calculateInstallments', () => {
        it('deve calcular 1 parcela sem taxa', () => {
            const result = FinancialCalculator.calculateInstallments(100, 1, 0);
            expect(result.totalAmount).toBe(100);
            expect(result.netTotal).toBe(100);
            expect(result.installments).toHaveLength(1);
            expect(result.installments[0].grossAmount).toBe(100);
            expect(result.installments[0].netAmount).toBe(100);
            expect(result.installments[0].feeAmount).toBe(0);
        });

        it('deve calcular múltiplas parcelas arredondando corretamente (centavos na última)', () => {
            const result = FinancialCalculator.calculateInstallments(100, 3, 0); // 100 / 3 = 33.333...

            expect(result.installments).toHaveLength(3);
            expect(result.installments[0].grossAmount).toBe(33.33);
            expect(result.installments[1].grossAmount).toBe(33.33);
            expect(result.installments[2].grossAmount).toBe(33.34); // Diferença de 1 centavo!
        });

        it('deve calcular líquido e bruto com taxas associadas', () => {
            // 100 reais em 2 parcelas, 5% de taxa total (Atenção: taxa calculada sobre o total nas regras atuais)
            const result = FinancialCalculator.calculateInstallments(100, 2, 5);

            expect(result.netTotal).toBe(95); // 100 - (100 * 5%) = 95
            expect(result.installments).toHaveLength(2);

            expect(result.installments[0].grossAmount).toBe(50);
            expect(result.installments[0].netAmount).toBe(47.5); // 95 / 2

            expect(result.installments[1].grossAmount).toBe(50);
            expect(result.installments[1].netAmount).toBe(47.5);

            // Fee Amount: 50 * 5% = 2.5
            expect(result.installments[0].feeAmount).toBe(2.5);
        });

        it('deve retornar lista vazia para valor zero', () => {
            const result = FinancialCalculator.calculateInstallments(0, 5, 10);
            expect(result).toStrictEqual([]);
        });
    });
});
