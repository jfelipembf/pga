import { payableRepository } from '../../data/repositories/PayableRepository'
import { transactionRepository } from '../../data/repositories/TransactionRepository'
import { bankAccountRepository } from '../../data/repositories/BankAccountRepository'
import { AuditService } from '../Audit/AuditService'
import { PayableSchema } from '../../data/schemas/Financial/PayableSchema'
import { generateExpenseNumber, generateDailySequential } from '../../utils/idGenerators'
import { LedgerService } from '../Ledger/LedgerService'

/**
 * Serviço para Gestão de Contas a Pagar (Payables)
 * Integrado com sistema bancário e contábil (partidas dobradas)
 */
export const PayableService = {
    /**
     * Cria uma nova conta a pagar com validação segura e ID amigável
     * CONTABILMENTE: Registra a DESPESA (regime de competência)
     */
    createPayable: async (idTenant, idBranch, userId, payableData) => {
        await PayableSchema.validate(payableData, { abortEarly: false })

        // Gerar ID amigável
        const now = new Date();
        const sequentialNumber = generateDailySequential(now);
        const expenseNumber = generateExpenseNumber(now, sequentialNumber);

        const newPayable = await payableRepository.create(idTenant, idBranch, {
            ...payableData,
            expenseNumber,
            amount: parseFloat(payableData.amount) || 0,
            status: payableData.status || 'open',
            createdBy: userId,
            createdAt: new Date()
        })

        // ✅ LANÇAMENTO CONTÁBIL (Partidas Dobradas)
        // D - Despesa (aumenta a despesa no DRE)
        // C - Contas a Pagar (aumenta o passivo no Balanço)
        try {
            await LedgerService.createPayableEntry(idTenant, idBranch, newPayable)
        } catch (ledgerError) {
            console.error("Erro ao criar lançamento contábil:", ledgerError)
            // Não falha a operação, mas loga o erro
        }

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'PAYABLE_CREATED',
            entityType: 'payable',
            entityId: newPayable.id,
            description: `Nova conta a pagar registrada: ${expenseNumber} - ${payableData.description || payableData.title}`
        })

        return newPayable
    },

    /**
     * Realiza o pagamento (baixa) de uma conta com integração bancária COMPLETA
     * CONTABILMENTE: Baixa o passivo e debita o banco (regime de caixa)
     */
    payBill: async (idTenant, idBranch, userId, idPayable, paymentData) => {
        const payable = await payableRepository.findById(idTenant, idBranch, idPayable)
        if (!payable) throw new Error("Conta não encontrada")
        if (payable.status === 'paid') throw new Error("Conta já está paga")

        const { paymentDate, amount: amountPaid, paymentMethod, idBankAccount, notes } = paymentData;
        const finalAmount = parseFloat(amountPaid) || parseFloat(payable.amount);

        // 1. Validar e Buscar Conta Bancária
        if (!idBankAccount) throw new Error("Conta bancária de origem não informada");
        const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
        if (!bankAccount) throw new Error("Conta bancária não encontrada");

        // Verificar saldo suficiente
        const currentBalance = Number(bankAccount.currentBalance || 0);
        if (currentBalance < finalAmount) {
            throw new Error(`Saldo insuficiente. Disponível: R$ ${currentBalance.toFixed(2)}, Necessário: R$ ${finalAmount.toFixed(2)}`);
        }

        // 2. Criar Transação Financeira (Saída)
        const transactionData = {
            date: paymentDate,
            description: `Pagamento - ${payable.supplier || 'Fornecedor'} - ${payable.description || payable.title}`,
            amount: finalAmount,
            type: 'expense',
            category: payable.chartOfAccountName || 'Despesas Gerais',
            method: paymentMethod,
            idBankAccount: idBankAccount,
            idSource: idPayable,
            sourceType: 'payable',
            notes: notes || '',
            costCenter: payable.costCenterName,
            supplier: payable.supplier,
            documentNumber: payable.documentNumber,
            createdAt: new Date().toISOString()
        };
        await transactionRepository.create(idTenant, idBranch, transactionData);

        // 3. DEBITAR Saldo Bancário
        const newBalance = currentBalance - finalAmount;
        await bankAccountRepository.update(idTenant, idBranch, idBankAccount, {
            currentBalance: newBalance,
            updatedAt: new Date()
        });

        // 4. ✅ LANÇAMENTO CONTÁBIL (Partidas Dobradas)
        // D - Contas a Pagar (baixa o passivo)
        // C - Banco (saída de dinheiro)
        try {
            await LedgerService.payPayableEntry(idTenant, idBranch, payable, {
                ...paymentData,
                amount: finalAmount,
                bankAccountName: bankAccount.name
            })
        } catch (ledgerError) {
            console.error("Erro ao criar lançamento contábil de pagamento:", ledgerError)
            // Não falha a operação, mas loga o erro
        }

        // 5. Atualizar Status do Payable
        await payableRepository.update(idTenant, idBranch, idPayable, {
            status: 'paid',
            paymentDate: paymentDate,
            paymentMethod: paymentMethod,
            idBankAccount: idBankAccount,
            amountPaid: finalAmount,
            paidAt: new Date(),
            updatedAt: new Date()
        })

        // 6. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'PAYABLE_PAID',
            entityType: 'payable',
            entityId: idPayable,
            description: `Conta paga: ${payable.expenseNumber || idPayable}. Valor: R$ ${finalAmount.toFixed(2)} via ${paymentMethod}`
        })

        return { success: true, newBalance };
    },

    /**
     * Lista todas as contas a pagar da unidade
     */
    listAll: async (idTenant, idBranch) => {
        return await payableRepository.findAll(idTenant, idBranch)
    },

    /**
     * Atualiza uma conta existente
     */
    updatePayable: async (idTenant, idBranch, userId, id, data) => {
        const result = await payableRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: new Date()
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'PAYABLE_UPDATED',
            entityType: 'payable',
            entityId: id,
            description: `Conta a pagar atualizada: ${data.description || data.title}`
        })

        return result
    }
}
