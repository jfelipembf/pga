import { receivableRepository } from '../../data/repositories/ReceivableRepository'
import { salesRepository } from '../../data/repositories/SalesRepository'
import { CashierService } from './CashierService'
import { AuditService } from '../Core/AuditService'
import { LedgerService, safeLedgerCall } from '../Ledger/LedgerService'
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
            description: receivable.description || `Recebimento de Título #${idReceivable.substring(0, 6)}`,
            clientName: receivable.clientName,
            idReceivable: idReceivable,
            idSale: receivable.idSale,
            idBankAccount: idBankAccount,
            skipLedger: true // ReceivableService.settleReceivable já cria o lançamento contábil via settleReceivableEntry
        })

        // 4. Atualizar Saldo da Conta Bancária (ATÔMICO via increment)
        if (bankAccount) {
            await bankAccountRepository.adjustBalance(idTenant, idBranch, idBankAccount, netAmount);
        }

        // 5. Atualizar o documento de Recebível
        const remaining = Math.max(0, (receivable.pending || receivable.amount) - settlementAmount);
        const updatedData = {
            paid: (receivable.paid || 0) + settlementAmount,
            pending: remaining,
            status: remaining <= 0.01 ? 'paid' : 'open',
            settlementDate: normalizeDate(paymentData.settlementDate) || normalizeDate(new Date()),
            amountReceived: netAmount,
            extraFeeAmount: feeAmount,
            idBankAccount: idBankAccount,
            paidAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        }

        await receivableRepository.update(idTenant, idBranch, idReceivable, updatedData)

        // 6. Se sobrou resíduo e o usuário quer manter aberto (Opcional - pode ser tratado via nova criação de título se necessário)
        // Por padrão o 'pending' já reflete o saldo aberto se for liquidação parcial.

        // 7. Lançamento Contábil
        await safeLedgerCall(idTenant, idBranch,
            () => LedgerService.settleReceivableEntry(idTenant, idBranch, receivable, {
                grossAmount: settlementAmount,
                feeAmount: feeAmount,
                netAmount: netAmount,
                idBankAccount: idBankAccount,
                bankAccountName: bankAccount?.name || 'Caixa',
                settlementDate: updatedData.settlementDate,
                paymentMethod: paymentData.method || receivable.paymentMethod
            }),
            { sourceType: 'receivable', sourceId: idReceivable, operation: 'settleReceivableEntry' }
        );

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
                    updatedAt: normalizeDate(new Date())
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
        const { FinancialCalculator } = await import('./Core/FinancialCalculator'); // Import dinâmico para evitar ciclo se houver

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

        // Delega a lógica de negócio para o Core Calculator (SSOT)
        return FinancialCalculator.calculateClientSummary(sales, receivables);
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
            updatedAt: normalizeDate(new Date())
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
            description: `Título a receber excluído (soft delete): ${receivable.description || idReceivable}`,
            details: { snapshot: receivable }
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
                updatedAt: normalizeDate(new Date())
            });

            // Lançamento Contábil (Individual por recebível para o Ledger bater)
            await safeLedgerCall(idTenant, idBranch,
                () => LedgerService.settleReceivableEntry(idTenant, idBranch, rawRec, {
                    grossAmount: gross,
                    feeAmount: feeShare,
                    netAmount: netShare,
                    idBankAccount: idBankAccount,
                    bankAccountName: bankAccount.name,
                    settlementDate: normalizeDate(settlementDate)
                }),
                { sourceType: 'receivable', sourceId: id, operation: 'settleReceivableEntry_anticipation' }
            );
        }

        // 3. Registrar Transações Financeiras de Ajuste (apenas para extrato/relatórios)
        // Nota: Não passa pelo CashierService pois antecipação é operação administrativa.
        // O Ledger já foi atualizado individualmente por recebível acima.
        await transactionRepository.create(idTenant, idBranch, {
            date: normalizeDate(settlementDate),
            description: `Antecipação (Valor Bruto) - ${receivableIds.length} títulos`,
            amount: totalGross,
            type: 'income',
            category: 'Movimentação Interna (Antecipação)',
            idBankAccount,
            sourceType: 'receivable_bulk',
            idCashierSession: null,
            systemGenerated: true,
            skipLedger: true,
            createdAt: normalizeDate(new Date()),
            userName: userName
        });

        await transactionRepository.create(idTenant, idBranch, {
            date: normalizeDate(settlementDate),
            description: `Taxa de Antecipação - ${anticipationFee}%`,
            amount: totalExtraFee,
            type: 'expense',
            category: 'Taxa de Antecipação',
            idBankAccount,
            sourceType: 'receivable_fee',
            idCashierSession: null,
            systemGenerated: true,
            skipLedger: true,
            createdAt: normalizeDate(new Date()),
            userName: userName
        });

        // 4. Atualizar Saldo Bancário Final (ATÔMICO via increment)
        await bankAccountRepository.adjustBalance(idTenant, idBranch, idBankAccount, Number(totalNet));

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
