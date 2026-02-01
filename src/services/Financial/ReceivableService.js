import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { CashierService } from './CashierService'
import { AuditService } from '../Audit/AuditService'
import { LedgerService } from '../Ledger/LedgerService'


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

        // 2. ✅ LANÇAMENTO CONTÁBIL (Partidas Dobradas - Liquidação de Recebível)
        // Baixa o recebível e credita o banco/caixa
        // Se houver taxa, registra como despesa
        const feeAmount = receivable.feeAmount || 0
        const netAmount = amountToPay - feeAmount

        try {
            await LedgerService.settleReceivableEntry(idTenant, idBranch, receivable, {
                amount: amountToPay,
                feeAmount: feeAmount,
                netAmount: netAmount,
                idBankAccount: paymentData.idBankAccount || 'CAIXA',
                bankAccountName: paymentData.bankAccountName || 'Caixa',
                settlementDate: new Date()
            })
        } catch (ledgerError) {
            console.error("Erro ao criar lançamento contábil de recebimento:", ledgerError)
            // Não falha a operação, mas loga o erro
        }

        // 3. Registrar no Fluxo de Caixa (Income)
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: amountToPay,
            netAmount: netAmount, // Valor líquido (descontando taxas)
            category: 'receivable_payment',
            method: paymentData.method || receivable.paymentMethod,
            description: `Rec. Título ${idReceivable} - Cliente: ${receivable.clientName}`,
            idReceivable: idReceivable,
            idSale: receivable.idSale
        })

        // 4. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'RECEIVABLE_SETTLED',
            entityType: 'receivable',
            entityId: idReceivable,
            description: `Recebimento de R$ ${amountToPay.toFixed(2)} do cliente ${receivable.clientName}${feeAmount > 0 ? ` (Taxa: R$ ${feeAmount.toFixed(2)})` : ''}`,
            details: updatedData
        })

        return { id: idReceivable, ...updatedData }
    },

    /**
     * Obtém o resumo financeiro consolidado de um cliente.
     */
    getSummaryByClient: async (idTenant, idBranch, idClient) => {
        const receivables = await receivableRepository.findWhere(idTenant, idBranch, [
            ['idClient', '==', idClient],
            ['deleted', '==', false]
        ]);

        const summary = {
            totalOwed: 0,
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
            receivablesCount: receivables.length
        };

        const now = new Date(); // Usar Date nativo

        receivables.forEach(rec => {
            const amount = parseFloat(rec.amount) || 0;
            const paid = parseFloat(rec.paid) || 0;
            const pending = Math.max(0, amount - paid);

            summary.totalOwed += amount;
            summary.totalPaid += paid;
            summary.totalPending += pending;

            if (pending > 0 && rec.dueDate && new Date(rec.dueDate) < now) {
                summary.totalOverdue += pending;
            }
        });

        return summary;
    },

    /**
     * Lista recebíveis de um cliente.
     */
    listByClient: async (idTenant, idBranch, idClient) => {
        return await receivableRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient], ['deleted', '==', false]],
            { field: 'dueDate', direction: 'desc' }
        );
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
