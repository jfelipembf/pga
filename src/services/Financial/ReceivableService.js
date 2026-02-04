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
        if (receivable.deletedAt) throw new Error("Título já foi excluído")

        const amountToPay = parseFloat(paymentData.amount) || receivable.pending
        const settlementAmount = Number(amountToPay);

        // 1. Validar e Buscar Conta Bancária
        const { bankAccountRepository } = await import('../../data/repositories/BankAccountRepository')
        const idBankAccount = paymentData.idBankAccount || 'CAIXA'
        const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
        if (!bankAccount && idBankAccount !== 'CAIXA') throw new Error("Conta bancária de destino não encontrada.");

        // 2. Cálculo de Taxas
        const feePercent = parseFloat(paymentData.estimatedFee) || receivable.feePercent || 0;
        const feeAmount = feePercent > 0 ? (settlementAmount * (feePercent / 100)) : (receivable.feeAmount || 0);
        const netAmount = settlementAmount - feeAmount;

        // 3. Registrar no Fluxo de Caixa (Income)
        await CashierService.registerMovement(idTenant, idBranch, userId, {
            type: 'income',
            amount: settlementAmount,
            netAmount: netAmount,
            category: 'receivable_payment',
            method: paymentData.method || receivable.paymentMethod,
            description: `Rec. Título ${idReceivable} - Cliente: ${receivable.clientName}`,
            clientName: receivable.clientName,
            idReceivable: idReceivable,
            idSale: receivable.idSale,
            idBankAccount: idBankAccount
        })

        // 4. Atualizar Saldo da Conta Bancária (se não for caixa manual)
        if (bankAccount) {
            const currentBalance = Number(bankAccount.currentBalance || 0);
            const newBalance = currentBalance + netAmount;
            await bankAccountRepository.update(idTenant, idBranch, idBankAccount, {
                currentBalance: newBalance,
                updatedAt: new Date()
            });
        }

        // 5. Atualizar o documento de Recebível
        const remaining = Math.max(0, (receivable.pending || receivable.amount) - settlementAmount);
        const updatedData = {
            paid: (receivable.paid || 0) + settlementAmount,
            pending: remaining,
            status: remaining <= 0.01 ? 'paid' : 'open',
            settlementDate: normalizeDate(paymentData.settlementDate) || new Date(),
            amountReceived: netAmount,
            extraFeeAmount: feeAmount,
            idBankAccount: idBankAccount,
            paidAt: new Date(),
            updatedAt: new Date()
        }

        await receivableRepository.update(idTenant, idBranch, idReceivable, updatedData)

        // 6. Se sobrou resíduo e o usuário quer manter aberto (Opcional - pode ser tratado via nova criação de título se necessário)
        // Por padrão o 'pending' já reflete o saldo aberto se for liquidação parcial.

        // 7. Lançamento Contábil
        try {
            await LedgerService.settleReceivableEntry(idTenant, idBranch, receivable, {
                amount: settlementAmount,
                feeAmount: feeAmount,
                netAmount: netAmount,
                idBankAccount: idBankAccount,
                bankAccountName: bankAccount?.name || 'Caixa',
                settlementDate: updatedData.settlementDate
            })
        } catch (ledgerError) {
            console.error("Erro contábil:", ledgerError)
        }

        // 8. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId,
            userName: paymentData.userName,
            action: 'RECEIVABLE_SETTLED',
            entityType: 'receivable',
            entityId: idReceivable,
            description: `Recebimento de R$ ${settlementAmount.toFixed(2)} do cliente ${receivable.clientName}`,
            details: { ...updatedData, method: paymentData.method }
        })

        // 9. ATUALIZAÇÃO DO STATUS DA VENDA
        if (receivable.idSale && updatedData.status === 'paid') {
            const otherPending = await receivableRepository.findWhere(idTenant, idBranch, [
                ['idSale', '==', receivable.idSale],
                ['status', '==', 'open'],
                ['type', '==', 'client'],
                ['deletedAt', '==', null]
            ]);

            if (otherPending.filter(p => p.id !== idReceivable).length === 0) {
                await salesRepository.update(idTenant, idBranch, receivable.idSale, {
                    status: 'paid',
                    updatedAt: new Date()
                });
            }
        }

        return { id: idReceivable, ...updatedData }
    },

    /**
     * Lista todos os recebíveis com filtros (Data, Limite, etc)
     */
    listAll: async (idTenant, idBranch, options = {}) => {
        const { startDate, endDate, limit = 50 } = options;
        const filters = [];

        if (startDate) {
            const start = normalizeDate(startDate);
            if (start) filters.push(['dueDate', '>=', start]);
        }
        if (endDate) {
            const end = normalizeDate(endDate);
            if (end) filters.push(['dueDate', '<=', end]);
        }

        // Buscamos do repositório
        // Nota: Não filtramos deletedAt no query para evitar necessidade de índices compostos complexos (Robustez)
        const rawData = await receivableRepository.findWhere(
            idTenant, idBranch,
            filters,
            { field: 'dueDate', direction: 'desc' },
            limit
        );

        // Filtramos em memória
        return rawData.filter(r => !r.deletedAt);
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
                ['status', '!=', 'cancelled'],
                ['deletedAt', '==', null]
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


        return summary;
    },

    /**
     * Lista recebíveis de um cliente.
     */
    listByClient: async (idTenant, idBranch, idClient) => {
        return await receivableRepository.findWhere(idTenant, idBranch,
            [['idClient', '==', idClient], ['deletedAt', '==', null]],
            { field: 'dueDate', direction: 'desc' }
        );
    },

    /**
     * Cancela um recebível
     */
    cancelReceivable: async (idTenant, idBranch, userId, idReceivable, reason) => {
        const receivable = await receivableRepository.findById(idTenant, idBranch, idReceivable)
        if (!receivable) throw new Error("Título não encontrado")
        if (receivable.status === 'paid') throw new Error("Não é possível cancelar um título já recebido.")

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
    },

    /**
     * Soft Delete (Exclui sem perder histórico financeiro)
     */
    deleteReceivable: async (idTenant, idBranch, userId, idReceivable) => {
        const receivable = await receivableRepository.findById(idTenant, idBranch, idReceivable)
        if (!receivable) throw new Error("Título não encontrado")

        if (receivable.status === 'paid') {
            throw new Error("SEGURANÇA: Não é possível excluir um título já pago. Cancele ou estorne o pagamento primeiro.")
        }

        await receivableRepository.softDelete(idTenant, idBranch, idReceivable, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'RECEIVABLE_DELETED',
            entityType: 'receivable',
            entityId: idReceivable,
            description: `Título a receber excluído (soft delete): ${receivable.description || idReceivable}`
        })
    },

    /**
     * Antecipação de Recebíveis (Bulk)
     */
    anticipateReceivables: async (idTenant, idBranch, userId, data) => {
        const { receivableIds, idBankAccount, anticipationFee, totalNet, totalGross, totalExtraFee, settlementDate, userName } = data;

        // 1. Buscar conta bancária
        const { bankAccountRepository } = await import('../../data/repositories/BankAccountRepository')
        const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
        if (!bankAccount) throw new Error("Conta não encontrada");

        const { transactionRepository } = await import('../../data/repositories/TransactionRepository')

        // 2. Processar cada recebível
        for (const id of receivableIds) {
            const rawRec = await receivableRepository.findById(idTenant, idBranch, id);
            const gross = parseFloat(rawRec.amount) || 0;
            const feeShare = gross * (anticipationFee / 100);
            const netShare = gross - feeShare;

            await receivableRepository.update(idTenant, idBranch, id, {
                status: 'paid',
                settlementDate: settlementDate,
                amountReceived: netShare,
                extraFeeAmount: feeShare,
                idBankAccount,
                notes: `Antecipado via Bulk. Taxa: ${anticipationFee}%`,
                updatedAt: new Date()
            });

            // Lançamento Contábil (Individual por recebível para o Ledger bater)
            try {
                await LedgerService.settleReceivableEntry(idTenant, idBranch, rawRec, {
                    amount: gross,
                    feeAmount: feeShare,
                    netAmount: netShare,
                    idBankAccount: idBankAccount,
                    bankAccountName: bankAccount.name,
                    settlementDate: normalizeDate(settlementDate)
                });
            } catch (le) { console.error("Erro contábil na antecipação:", le); }
        }

        // 3. Registrar Transações Financeiras de Ajuste de Caixa (Bulk para o extrato ficar limpo)
        await transactionRepository.create(idTenant, idBranch, {
            date: normalizeDate(settlementDate),
            description: `Antecipação (Valor Bruto) - ${receivableIds.length} títulos`,
            amount: totalGross,
            type: 'income',
            category: 'Movimentação Interna (Antecipação)',
            idBankAccount,
            sourceType: 'receivable_bulk',
            createdAt: new Date(),
            userName: userName
        });

        await transactionRepository.create(idTenant, idBranch, {
            date: normalizeDate(settlementDate),
            description: `Taxa de Antecipação - ${anticipationFee}%`,
            amount: totalExtraFee,
            type: 'expense',
            idBankAccount,
            sourceType: 'receivable_fee',
            createdAt: new Date(),
            userName: userName
        });

        // 4. Atualizar Saldo Bancário Final
        const currentBalance = Number(bankAccount.currentBalance || 0);
        const newBalance = currentBalance + Number(totalNet);
        await bankAccountRepository.update(idTenant, idBranch, idBankAccount, {
            currentBalance: newBalance,
            updatedAt: new Date()
        });

        // 5. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId,
            userName: userName,
            action: 'RECEIVABLE_ANTICIPATED',
            entityType: 'receivable_bulk',
            entityId: receivableIds.join(','),
            description: `Antecipação realizada: ${receivableIds.length} títulos. Taxa: ${anticipationFee}%`,
            details: { totalNet, totalGross, totalExtraFee }
        });

        return { totalNet, count: receivableIds.length };
    }
}
