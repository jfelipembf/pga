import { bankAccountRepository } from "../../data/repositories/BankAccountRepository"
import { transactionRepository } from "../../data/repositories/TransactionRepository"
import { BankAccountSchema } from "../../data/schemas/FinancialSchemas"
import { LedgerService } from "../Ledger/LedgerService"
import { AuditService } from "../Audit/AuditService"
import { normalizeDate } from "../../utils/date"

export const BankAccountService = {

    createAccount: async (idTenant, idBranch, userId, data) => {
        try {
            const validated = await BankAccountSchema.validate(data, { abortEarly: false })
            const payload = {
                ...validated,
                createdAt: normalizeDate(new Date()),
                updatedAt: normalizeDate(new Date()),
                deletedAt: null
            }

            const newAccount = await bankAccountRepository.create(idTenant, idBranch, payload)

            // Se tem saldo inicial, cria transação de Aporte
            const initialBalance = parseFloat(data.currentBalance) || 0;
            if (initialBalance > 0) {
                await transactionRepository.create(idTenant, idBranch, {
                    date: normalizeDate(new Date()),
                    description: `Saldo Inicial - ${data.name}`,
                    amount: initialBalance,
                    type: 'income',
                    category: 'Saldo Inicial',
                    idBankAccount: newAccount.id,
                    sourceType: 'opening_balance',
                    createdAt: normalizeDate(new Date())
                });

                // Lançamento Contábil
                await LedgerService.createOpeningBalanceEntry(idTenant, idBranch, newAccount.id, data.name, initialBalance, false);
            }

            await AuditService.log({
                idTenant, idBranch, userId,
                userName: data.userName,
                action: 'BANK_ACCOUNT_CREATED',
                entityType: 'bankAccount',
                entityId: newAccount.id,
                description: `Nova conta bancária criada: ${data.name} com saldo inicial de R$ ${initialBalance.toFixed(2)}`
            });

            return newAccount
        } catch (error) {
            console.error("BankAccountService error:", error)
            throw error
        }
    },

    listActive: async (idTenant, idBranch) => {
        return await bankAccountRepository.findActive(idTenant, idBranch)
    },

    listAll: async (idTenant, idBranch) => {
        return await bankAccountRepository.findVisible(idTenant, idBranch)
    },

    update: async (idTenant, idBranch, userId, id, data) => {
        // Verificar se houve mudança de saldo manual
        const currentAccount = await bankAccountRepository.findById(idTenant, idBranch, id);
        const oldBalance = parseFloat(currentAccount?.currentBalance || 0);
        const newBalance = parseFloat(data.currentBalance); // Pode ser undefined

        const payload = { ...data, updatedAt: normalizeDate(new Date()) }

        // Se usuário mandou um novo saldo diferente do atual
        if (!isNaN(newBalance) && Math.abs(newBalance - oldBalance) > 0.01) {
            const diff = newBalance - oldBalance;
            const isPositive = diff > 0;

            // Criar Transação de Ajuste
            await transactionRepository.create(idTenant, idBranch, {
                date: normalizeDate(new Date()),
                description: `Ajuste Manual de Saldo`,
                amount: Math.abs(diff),
                type: isPositive ? 'income' : 'expense',
                category: 'Ajuste de Saldo',
                idBankAccount: id,
                sourceType: 'balance_adjustment',
                notes: 'Ajuste realizado na edição da conta bancária.',
                createdAt: normalizeDate(new Date())
            });

            // Lançamento Contábil
            await LedgerService.createOpeningBalanceEntry(idTenant, idBranch, id, currentAccount.name, diff, true);
        }

        const result = await bankAccountRepository.update(idTenant, idBranch, id, payload)

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: data.userName,
            action: 'BANK_ACCOUNT_UPDATED',
            entityType: 'bankAccount',
            entityId: id,
            description: `Conta bancária atualizada: ${currentAccount.name}`,
            details: data
        });

        return result
    },

    deactivate: async (idTenant, idBranch, userId, id) => {
        const result = await bankAccountRepository.update(idTenant, idBranch, id, {
            isActive: false,
            updatedAt: normalizeDate(new Date())
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'BANK_ACCOUNT_DEACTIVATED',
            entityType: 'bankAccount',
            entityId: id,
            description: `Conta bancária desativada.`
        });

        return result
    },

    delete: async (idTenant, idBranch, userId, id) => {
        // 1. CHECK: Tem transações vinculadas?
        const transactions = await transactionRepository.findWhere(idTenant, idBranch, [
            ['idBankAccount', '==', id],
            ['deletedAt', '==', null]
        ], null, 1);

        if (transactions.length > 0) {
            throw new Error("SEGURANÇA: Esta conta possui histórico de transações e não pode ser excluída para preservar a integridade financeira. Sugestão: Apenas desative a conta.");
        }

        // 2. CHECK: É uma conta principal?
        const account = await bankAccountRepository.findById(idTenant, idBranch, id);
        if (account?.isPrimary) {
            throw new Error("SEGURANÇA: Não é possível excluir a conta principal do sistema.");
        }

        const result = await bankAccountRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'BANK_ACCOUNT_DELETED',
            entityType: 'bankAccount',
            entityId: id,
            description: `Conta bancária excluída (soft delete): ${account?.name}`
        });

        return result
    }
}
