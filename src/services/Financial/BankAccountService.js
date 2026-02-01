import { bankAccountRepository } from "../../data/repositories/BankAccountRepository"
import { transactionRepository } from "../../data/repositories/TransactionRepository"
import { BankAccountSchema } from "../../data/schemas/FinancialSchemas"
import { LedgerService } from "../Ledger/LedgerService"

export const BankAccountService = {

    createAccount: async (idTenant, idBranch, data) => {
        try {
            const validated = await BankAccountSchema.validate(data, { abortEarly: false })
            const payload = {
                ...validated,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const newAccount = await bankAccountRepository.create(idTenant, idBranch, payload)

            // Se tem saldo inicial, cria transação de Aporte
            const initialBalance = parseFloat(data.currentBalance) || 0;
            if (initialBalance > 0) {
                await transactionRepository.create(idTenant, idBranch, {
                    date: new Date(),
                    description: `Saldo Inicial - ${data.name}`,
                    amount: initialBalance,
                    type: 'income',
                    category: 'Saldo Inicial',
                    idBankAccount: newAccount.id,
                    sourceType: 'opening_balance',
                    createdAt: new Date()
                });

                // Lançamento Contábil
                await LedgerService.createOpeningBalanceEntry(idTenant, idBranch, newAccount.id, data.name, initialBalance, false);
            }

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
        return await bankAccountRepository.findAll(idTenant, idBranch)
    },

    update: async (idTenant, idBranch, id, data) => {
        // Verificar se houve mudança de saldo manual
        const currentAccount = await bankAccountRepository.findById(idTenant, idBranch, id);
        const oldBalance = parseFloat(currentAccount?.currentBalance || 0);
        const newBalance = parseFloat(data.currentBalance); // Pode ser undefined

        const payload = { ...data, updatedAt: new Date() }

        // Se usuário mandou um novo saldo diferente do atual
        if (!isNaN(newBalance) && Math.abs(newBalance - oldBalance) > 0.01) {
            const diff = newBalance - oldBalance;
            const isPositive = diff > 0;

            // Criar Transação de Ajuste
            await transactionRepository.create(idTenant, idBranch, {
                date: new Date(),
                description: `Ajuste Manual de Saldo`,
                amount: Math.abs(diff),
                type: isPositive ? 'income' : 'expense',
                category: 'Ajuste de Saldo',
                idBankAccount: id,
                sourceType: 'balance_adjustment',
                notes: 'Ajuste realizado na edição da conta bancária.',
                createdAt: new Date()
            });

            // Lançamento Contábil
            await LedgerService.createOpeningBalanceEntry(idTenant, idBranch, id, currentAccount.name, diff, true);
        }

        return await bankAccountRepository.update(idTenant, idBranch, id, payload)
    },

    deactivate: async (idTenant, idBranch, id) => {
        return await bankAccountRepository.update(idTenant, idBranch, id, {
            isActive: false,
            updatedAt: new Date()
        })
    },

    delete: async (idTenant, idBranch, id) => {
        return await bankAccountRepository.delete(idTenant, idBranch, id)
    }
}
