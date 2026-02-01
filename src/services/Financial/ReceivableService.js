import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { CashierService } from './CashierService'
import { AuditService } from '../Audit/AuditService'


/**
 * Serviço para Gestão de Contas a Receber (Receivables)
 */
export const ReceivableService = {
    /**
     * Liquida um recebível (Baixa de pagamento)
     */
    settleReceivable: async (idTenant, idBranch, userId, idReceivable, paymentData) => {
        const receivable = await receivableRepository.findById(idTenant, idBranch, idReceivable)
        if (!receivable) throw new Error("Título a receber não encontrado")
        if (receivable.status === 'paid') throw new Error("Título já está liquidado")

        const amountToPay = parseFloat(paymentData.amount) || receivable.pending

        // 1. Atualizar o documento de Recebível
        const updatedData = {
            paid: (receivable.paid || 0) + amountToPay,
            pending: Math.max(0, receivable.pending - amountToPay),
            status: (receivable.pending - amountToPay) <= 0 ? 'paid' : 'open',
            paidAt: new Date(),
            updatedAt: new Date()
        }

        await receivableRepository.update(idTenant, idBranch, idReceivable, updatedData)

        // 2. Registrar no Fluxo de Caixa (Income)
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: amountToPay,
            netAmount: amountToPay, // Aqui poderíamos descontar taxas se for uma baixa via cartão externo
            category: 'receivable_payment',
            method: paymentData.method || receivable.paymentMethod,
            description: `Rec. Título ${idReceivable} - Cliente: ${receivable.clientName}`,
            idReceivable: idReceivable,
            idSale: receivable.idSale
        })

        // 3. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'RECEIVABLE_SETTLED',
            entityType: 'receivable',
            entityId: idReceivable,
            description: `Recebimento de R$ ${amountToPay} do cliente ${receivable.clientName}`,
            details: updatedData
        })

        return { id: idReceivable, ...updatedData }
    },

    /**
     * Cancela um recebível
     */
    cancelReceivable: async (idTenant, idBranch, userId, idReceivable, reason) => {
        await receivableRepository.update(idTenant, idBranch, idReceivable, {
            status: 'cancelled',
            description: `Cancelado: ${reason}`,
            updatedAt: new Date()
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'RECEIVABLE_CANCELLED',
            entityType: 'receivable',
            entityId: idReceivable,
            description: `Título a receber cancelado. Motivo: ${reason}`
        })
    }
}
