import { bankAccountRepository } from "../../data/repositories/BankAccountRepository"
import { transactionRepository } from "../../data/repositories/TransactionRepository"
import { BankAccountSchema } from "../../data/schemas/FinancialSchemas"
import { LedgerService } from "../Ledger/LedgerService"
import { BankAccountAuditLogger } from "./audit/BankAccountAuditLogger"
import { BankAccountRules } from "./domain/BankAccountRules"
import { normalizeDate } from "../../utils/date"

export const BankAccountService = {

    createAccount: async (idTenant, idBranch, userId, data) => {
        const validated = await BankAccountSchema.validate(data, { abortEarly: false })
        const payload = {
            ...validated,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
            deletedAt: null
        }

        const newAccount = await bankAccountRepository.create(idTenant, idBranch, payload)

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

            await LedgerService.createOpeningBalanceEntry(idTenant, idBranch, newAccount.id, data.name, initialBalance, false);
        }

        await BankAccountAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: newAccount.id,
            accountName: data.name,
            initialBalance
        })

        return newAccount
    },

    listActive: async (idTenant, idBranch) => {
        return await bankAccountRepository.findActive(idTenant, idBranch)
    },

    listAll: async (idTenant, idBranch) => {
        return await bankAccountRepository.findVisible(idTenant, idBranch)
    },

    update: async (idTenant, idBranch, userId, id, data) => {
        const currentAccount = await bankAccountRepository.findById(idTenant, idBranch, id);
        const oldBalance = parseFloat(currentAccount?.currentBalance || 0);
        const newBalance = parseFloat(data.currentBalance);

        const payload = { ...data, updatedAt: normalizeDate(new Date()) }

        if (!isNaN(newBalance) && Math.abs(newBalance - oldBalance) > 0.01) {
            const diff = newBalance - oldBalance;
            const isPositive = diff > 0;

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

            await LedgerService.createOpeningBalanceEntry(idTenant, idBranch, id, currentAccount.name, diff, true);
        }

        const result = await bankAccountRepository.update(idTenant, idBranch, id, payload)

        await BankAccountAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData: currentAccount,
            newData: payload
        })

        return result
    },

    deactivate: async (idTenant, idBranch, userId, id) => {
        const result = await bankAccountRepository.update(idTenant, idBranch, id, {
            isActive: false,
            updatedAt: normalizeDate(new Date())
        })

        await BankAccountAuditLogger.logDeactivation({
            idTenant, idBranch, userId,
            entityId: id
        })

        return result
    },

    delete: async (idTenant, idBranch, userId, id) => {
        await BankAccountRules.validateForDeletion(idTenant, idBranch, id)

        const account = await bankAccountRepository.findById(idTenant, idBranch, id);
        BankAccountRules.validateNotPrimary(account)

        const result = await bankAccountRepository.softDelete(idTenant, idBranch, id, userId)

        await BankAccountAuditLogger.logDeletion({
            idTenant, idBranch, userId,
            entityId: id,
            accountName: account?.name,
            snapshot: account
        })

        return result
    }
}
