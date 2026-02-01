import { ledgerRepository } from '../../data/repositories/LedgerRepository'

/**
 * Contas Contábeis Padrão (Chart of Accounts - Plano de Contas)
 * Baseado no padrão brasileiro de contabilidade
 */
export const STANDARD_ACCOUNTS = {
    // ATIVOS
    BANK_ACCOUNTS: 'ATIVO_CIRCULANTE_BANCOS',
    CASH: 'ATIVO_CIRCULANTE_CAIXA',
    ACCOUNTS_RECEIVABLE: 'ATIVO_CIRCULANTE_CONTAS_A_RECEBER',

    // PASSIVOS
    ACCOUNTS_PAYABLE: 'PASSIVO_CIRCULANTE_CONTAS_A_PAGAR',
    SALARY_PAYABLE: 'PASSIVO_CIRCULANTE_SALARIOS',
    TAXES_PAYABLE: 'PASSIVO_CIRCULANTE_IMPOSTOS',

    // RECEITAS
    SALES_REVENUE: 'RECEITA_VENDAS',
    SERVICE_REVENUE: 'RECEITA_SERVICOS',

    // DESPESAS
    ADMINISTRATIVE_EXPENSES: 'DESPESA_ADMINISTRATIVA',
    OPERATIONAL_EXPENSES: 'DESPESA_OPERACIONAL',
    CARD_FEES: 'DESPESA_TAXAS_CARTAO',
    SALARY_EXPENSES: 'DESPESA_SALARIOS',
}

/**
 * Serviço de Lançamentos Contábeis (Ledger)
 * Sistema de Partidas Dobradas
 * 
 * PRINCÍPIO FUNDAMENTAL:
 * Todo lançamento contábil afeta PELO MENOS 2 contas
 * DÉBITO total = CRÉDITO total (sempre!)
 */
export const LedgerService = {
    /**
     * Lançamento: Reconhecimento de Despesa (Regime de Competência)
     * Quando: Ao CRIAR uma conta a pagar
     * 
     * Contabilmente:
     * D - Despesa Administrativa (ex: R$ 416)
     * C - Contas a Pagar (Passivo) (ex: R$ 416)
     */
    createPayableEntry: async (idTenant, idBranch, payable) => {
        const accountType = payable.chartOfAccountId || STANDARD_ACCOUNTS.ADMINISTRATIVE_EXPENSES

        return await ledgerRepository.create(idTenant, idBranch, {
            date: payable.createdAt || new Date(),
            description: `Reconhecimento de despesa: ${payable.supplier} - ${payable.description || payable.title}`,
            sourceType: 'payable',
            sourceId: payable.id,
            documentNumber: payable.expenseNumber,
            entries: [
                {
                    // DÉBITO: Aumenta a despesa (vai para o DRE)
                    account: accountType,
                    accountName: payable.chartOfAccountName || 'Despesa Administrativa',
                    debit: payable.amount,
                    credit: 0,
                    costCenter: payable.costCenterName
                },
                {
                    // CRÉDITO: Aumenta o passivo (dívida)
                    account: STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE,
                    accountName: 'Contas a Pagar',
                    debit: 0,
                    credit: payable.amount,
                    supplier: payable.supplier
                }
            ]
        })
    },

    /**
     * Lançamento: Pagamento de Despesa (Regime de Caixa)
     * Quando: Ao PAGAR efetivamente a conta
     * 
     * Contabilmente:
     * D - Contas a Pagar (baixa o passivo) (ex: R$ 416)
     * C - Banco (saída de dinheiro) (ex: R$ 416)
     */
    payPayableEntry: async (idTenant, idBranch, payable, payment) => {
        return await ledgerRepository.create(idTenant, idBranch, {
            date: new Date(payment.paymentDate),
            description: `Pagamento: ${payable.supplier} - ${payable.description || payable.title}`,
            sourceType: 'payable_payment',
            sourceId: payable.id,
            documentNumber: payable.expenseNumber,
            entries: [
                {
                    // DÉBITO: Diminui o passivo (baixa a dívida)
                    account: STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE,
                    accountName: 'Contas a Pagar',
                    debit: payment.amount,
                    credit: 0,
                    supplier: payable.supplier
                },
                {
                    // CRÉDITO: Diminui o saldo do banco (saída de dinheiro)
                    account: payment.idBankAccount,
                    accountName: payment.bankAccountName || 'Banco',
                    debit: 0,
                    credit: payment.amount,
                    paymentMethod: payment.paymentMethod
                }
            ]
        })
    },

    /**
     * Lançamento: Reconhecimento de Receita (Regime de Competência)
     * Quando: Ao CRIAR uma venda
     */
    createSaleEntry: async (idTenant, idBranch, sale) => {
        return await ledgerRepository.create(idTenant, idBranch, {
            date: sale.createdAt || new Date(),
            description: `Venda: ${sale.saleNumber}`,
            sourceType: 'sale',
            sourceId: sale.id,
            documentNumber: sale.saleNumber,
            entries: [
                {
                    // DÉBITO: Aumenta o ativo (direito a receber)
                    account: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE,
                    accountName: 'Contas a Receber',
                    debit: sale.total,
                    credit: 0
                },
                {
                    // CRÉDITO: Aumenta a receita (vai para o DRE)
                    account: STANDARD_ACCOUNTS.SALES_REVENUE,
                    accountName: 'Receita de Vendas',
                    debit: 0,
                    credit: sale.total
                }
            ]
        })
    },

    /**
     * Lançamento: Recebimento de Venda (Regime de Caixa)
     * Quando: Ao RECEBER o pagamento
     */
    settleReceivableEntry: async (idTenant, idBranch, receivable, settlement) => {
        const entries = [
            {
                // DÉBITO: Diminui contas a receber (baixa o direito)
                account: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE,
                accountName: 'Contas a Receber',
                debit: settlement.grossAmount,
                credit: 0
            }
        ]

        // Se tiver taxa de cartão, registra como despesa
        if (settlement.feeAmount > 0) {
            entries.push({
                // DÉBITO: Despesa com taxas
                account: STANDARD_ACCOUNTS.CARD_FEES,
                accountName: 'Despesa com Taxas de Cartão',
                debit: settlement.feeAmount,
                credit: 0
            })
        }

        // CRÉDITO: Aumenta o saldo do banco (entrada de dinheiro LÍQUIDA)
        entries.push({
            account: settlement.idBankAccount,
            accountName: settlement.bankAccountName || 'Banco',
            debit: 0,
            credit: settlement.netAmount + (settlement.feeAmount || 0)
        })

        return await ledgerRepository.create(idTenant, idBranch, {
            date: new Date(settlement.settlementDate),
            description: `Recebimento: ${receivable.description}`,
            sourceType: 'receivable_settlement',
            sourceId: receivable.id,
            entries
        })
    },

    /**
     * Busca o balancete de um período
     * Retorna saldos por conta
     */
    getTrialBalance: async (idTenant, idBranch, startDate, endDate) => {
        const entries = await ledgerRepository.findByPeriod(idTenant, idBranch, startDate, endDate)

        const balances = {}

        entries.forEach(entry => {
            entry.entries.forEach(item => {
                if (!balances[item.account]) {
                    balances[item.account] = {
                        account: item.account,
                        accountName: item.accountName,
                        debit: 0,
                        credit: 0,
                        balance: 0
                    }
                }

                balances[item.account].debit += item.debit || 0
                balances[item.account].credit += item.credit || 0
                balances[item.account].balance = balances[item.account].debit - balances[item.account].credit
            })
        })

        return Object.values(balances)
    }
}
