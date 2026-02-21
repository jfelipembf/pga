import { AuditService } from '../../Core/AuditService'

export const SalesAuditLogger = {
    logSaleProcessed: async ({ idTenant, idBranch, userId, userName, sale, clientName }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            userName,
            action: 'SALE_PROCESSED',
            entityType: 'sale',
            entityId: sale.id,
            description: `Venda #${sale.saleNumber} concluída para ${clientName}. Pago: R$${sale.totalPaid}`,
            details: {
                total: sale.total,
                balance: sale.balance,
                itemsCount: sale.items?.length || 0
            }
        })
    },

    logSaleDeleted: async ({ idTenant, idBranch, userId, sale }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'SALE_DELETED',
            entityType: 'sale',
            entityId: sale.id,
            description: `Venda #${sale.saleNumber} excluída (soft delete). Todos os títulos em aberto foram removidos.`,
            details: {
                snapshot: sale
            }
        })
    },

    logPaymentProcessed: async ({ idTenant, idBranch, userId, idSale, method, amount }) => {
        return AuditService.log({
            idTenant, idBranch, userId,
            action: 'PAYMENT_PROCESSED',
            entityType: 'sale',
            entityId: idSale,
            description: `Pagamento de R$ ${amount} processado via ${method.toUpperCase()}.`,
            details: { method, amount }
        })
    }
}
