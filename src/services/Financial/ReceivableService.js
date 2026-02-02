import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { salesRepository } from '../../data/repositories/SalesRepository'
import { CashierService } from './CashierService'
import { AuditService } from '../Audit/AuditService'
import { LedgerService } from '../Ledger/LedgerService'
import { normalizeDate } from '../../utils/date'


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
                settlementDate: normalizeDate(paymentData.settlementDate) || new Date()
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
            userName: paymentData.userName, // Recebe do frontend ou busca do Auth
            action: 'RECEIVABLE_SETTLED',
            entityType: 'receivable',
            entityId: idReceivable,
            description: `Recebimento de R$ ${amountToPay.toFixed(2)} do cliente ${receivable.clientName}${feeAmount > 0 ? ` (Taxa: R$ ${feeAmount.toFixed(2)})` : ''}`,
            details: updatedData
        })

        // 5. ATUALIZAÇÃO DO STATUS DA VENDA (Se originado de uma venda parcial)
        if (receivable.idSale && updatedData.status === 'paid') {
            try {
                // Verificar se existem outros títulos pendentes DO CLIENTE para esta mesma venda
                // Ignoramos tipos 'acquirer' (cartão), pois para o cliente a venda já está paga.
                const otherPending = await receivableRepository.findWhere(idTenant, idBranch, [
                    ['idSale', '==', receivable.idSale],
                    ['status', '==', 'open'],
                    ['type', '==', 'client'], // Apenas dívidas diretas do cliente
                    ['id', '!=', idReceivable]
                ]);

                // Se não houver mais nada em aberto para esta venda, mudamos o status da venda para 'paid'
                if (otherPending.length === 0) {
                    console.log(`[ReceivableService] OK! Tudo pago. Atualizando venda ${receivable.idSale} para 'paid'...`);
                    await salesRepository.update(idTenant, idBranch, receivable.idSale, {
                        status: 'paid',
                        updatedAt: new Date()
                    });
                    console.log(`[ReceivableService] Sucesso! Venda ${receivable.idSale} agora é 'paid'.`);
                } else {
                    console.log(`[ReceivableService] Venda ${receivable.idSale} ainda tem ${otherPending.length} pendências do tipo client.`);
                }
            } catch (saleUpdateError) {
                console.error("Erro ao tentar atualizar status da venda vinculada:", saleUpdateError);
            }
        }

        return { id: idReceivable, ...updatedData }
    },

    /**
     * Obtém o resumo financeiro consolidado de um cliente.
     * Cruza dados de Vendas (Volume/LTV) e Recebíveis (A Receber/Vencidos)
     */
    getSummaryByClient: async (idTenant, idBranch, idClient) => {
        // Buscar em paralelo para performance
        const [receivables, sales] = await Promise.all([
            receivableRepository.findWhere(idTenant, idBranch, [
                ['idClient', '==', idClient],
                ['status', '!=', 'cancelled']
            ]),
            salesRepository.findWhere(idTenant, idBranch, [
                ['idClient', '==', idClient]
            ])
        ]);

        const summary = {
            totalOwed: 0,      // Volume Bruto de Vendas
            totalPaid: 0,      // LTV Real (Dinheiro + Pix + Cartão + Parcelas Pagas)
            totalPending: 0,   // Saldo Devedor do Cliente (Tipo 'client')
            totalOverdue: 0,   // Débito Vencido do Cliente (Tipo 'client')
            totalBankReceivable: 0, // A Receber das Adquirentes (Tipo 'acquirer')
            receivablesCount: receivables.length
        };

        const now = new Date();

        // 1. Processar Volume de Vendas e Pagamentos Imediatos
        sales.forEach(sale => {
            const total = parseFloat(sale.total) || 0;
            const paidAtSale = parseFloat(sale.totalPaid) || 0;

            summary.totalOwed += total;
            summary.totalPaid += paidAtSale; // Cash/Pix/Card no ato da venda
        });

        // 2. Processar Títulos (Parcelas e Recebíveis Futuros)
        receivables.forEach(rec => {
            const amount = parseFloat(rec.amount) || 0;
            const paid = parseFloat(rec.paid) || 0;
            const pending = Math.max(0, amount - paid);

            // EVITAR DUPLICIDADE NO LTV:
            // Se o título for 'acquirer' (Cartão), o valor já foi contado no 'totalPaid' da Venda.
            // Somamos no LTV apenas as baixas de títulos do tipo 'client' (Boleto/Dinheiro Pendente).
            if (rec.type === 'client' || rec.paymentMethod === 'pending_payment') {
                summary.totalPaid += paid;
                summary.totalPending += pending;

                // Normalização de Data para Vencimento
                let dueDate = null;
                if (rec.dueDate) {
                    dueDate = typeof rec.dueDate.toDate === 'function' ? rec.dueDate.toDate() : new Date(rec.dueDate);
                }

                if (rec.status === 'open' && dueDate && dueDate < now) {
                    summary.totalOverdue += pending;
                }
            } else if (rec.type === 'acquirer') {
                // Dinheiro que o cliente já pagou (swiped), mas que o banco ainda não repassou
                summary.totalBankReceivable += pending;
                // Se a parcela do cartão for paga pelo banco, isso não é "novo faturamento" do aluno,
                // é apenas liquidação de algo que já contamos no ato da venda.
            }
        });

        console.log("[ReceivableService] Resumo Calculado:", {
            idClient,
            totalOwed: summary.totalOwed,
            totalPaid: summary.totalPaid,
            totalPending: summary.totalPending,
            totalBankReceivable: summary.totalBankReceivable
        });

        return summary;
    },

    /**
     * Lista recebíveis de um cliente.
     */
    listByClient: async (idTenant, idBranch, idClient) => {
        return await receivableRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient]],
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
