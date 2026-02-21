/**
 * Regras de Domínio para Vendas
 */
export const SalesRules = {
    /**
     * Classifica o tipo de receita com base nos itens da venda.
     * Retorna a conta contábil padrão correspondente.
     */
    classifyRevenue: (items = []) => {
        const hasProduct = items.some(i => ['product', 'produto'].includes(String(i.type).toLowerCase()));
        const hasContract = items.some(i => ['contract', 'contrato'].includes(String(i.type).toLowerCase()));
        const hasService = items.some(i => ['service', 'servico'].includes(String(i.type).toLowerCase()));

        if (hasProduct && !hasContract && !hasService) {
            return { id: 'PRODUCT_REVENUE', name: 'Venda de Produtos', type: 'product' };
        }

        if (hasContract) {
            return { id: 'SUBSCRIPTION_REVENUE', name: 'Mensalidades/Assinaturas', type: 'subscription' };
        }

        return { id: 'SERVICE_REVENUE', name: 'Prestação de Serviços', type: 'service' };
    },

    /**
     * Define o status real de uma venda cruzando com seus recebíveis específicos.
     * Fonte Única de Verdade para o status 'Live'.
     */
    calculateSaleStatus: (sale, receivables = []) => {
        if (!sale) return 'unknown';

        // Se a venda já foi cancelada explicitamente, permanece cancelada
        if (sale.status === 'cancelled') return 'cancelled';

        // Filtra recebíveis que pertencem a esta venda e são responsabilidade do cliente
        const clientReceivables = receivables.filter(r =>
            r.idSale === sale.id &&
            !r.deletedAt &&
            r.status !== 'cancelled' &&
            (r.type === 'client' || r.paymentMethod === 'pending_payment')
        );

        // Se não houver recebíveis de cliente pendentes, assumimos pago (pois o resto foi à vista ou cartão)
        if (clientReceivables.length === 0) return 'paid';

        // Verifica se ainda existe algum valor pendente nos títulos do cliente
        const totalPending = clientReceivables.reduce((sum, r) =>
            sum + (r.status === 'open' ? (parseFloat(r.pending) || 0) : 0),
            0);

        // Se deve mais de 1 centavo, está parcial. Senão, pago.
        return totalPending > 0.01 ? 'partial' : 'paid';
    }
}
