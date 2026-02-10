import { ledgerRepository } from '../../data/repositories/LedgerRepository'
import { ledgerErrorRepository } from '../../data/repositories/LedgerErrorRepository'
import { normalizeDate } from '../../utils/date'

/**
 * Contas Contábeis Padrão (Chart of Accounts - Plano de Contas)
 * Baseado no padrão brasileiro de contabilidade
 */
export const STANDARD_ACCOUNTS = {
    // RECEITAS (Grupo 1)
    PRODUCT_REVENUE: '1.1.1',
    SERVICE_REVENUE: '1.1.2',
    SUBSCRIPTION_REVENUE: '1.1.3',
    PENALTY_REVENUE: '1.1.4', // Receita de Multas
    REVENUE_DEDUCTIONS: '1.1.9', // Deduções/Estornos (Contra-receita)

    // DESPESAS (Grupo 2)
    ADMINISTRATIVE_EXPENSES: '2.1', // Grupo geral administrativo
    OPERATIONAL_EXPENSES: '2.4',
    CARD_FEES: '2.5.3',
    BANK_FEES: '2.5.4',
    SALARY_EXPENSES: '2.2.1',

    // ATIVOS (Grupo 3)
    BANK_ACCOUNTS: '3.1.1',
    CASH: '3.1.2',           // Caixa Físico (diferente de Banco)
    ACCOUNTS_RECEIVABLE: '3.1.3',

    // PASSIVOS (Grupo 4)
    ACCOUNTS_PAYABLE: '4.1.1',
    SALARY_PAYABLE: '4.1.2', // Salários a Pagar (diferente de Fornecedores)
    TAXES_PAYABLE: '4.1.3',

    // PATRIMÔNIO (Grupo 5)
    EQUITY_ADJUSTMENTS: '5.1.2',
};

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
            date: normalizeDate(payment.paymentDate) || new Date(),
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
        // Determinar conta de receita (Padrão: RECEITA_SERVICOS se não especificado)
        const revenueAccount = sale.revenueAccountId || STANDARD_ACCOUNTS.SERVICE_REVENUE;
        const revenueName = sale.revenueAccountName || 'Prestação de Serviços';

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
                    account: revenueAccount,
                    accountName: revenueName,
                    debit: 0,
                    credit: sale.total
                }
            ]
        })
    },

    /**
     * Lançamento: Multa por Cancelamento de Contrato
     * D - Contas a Receber (Ativo)
     * C - Receita de Multas (DRE)
     */
    createPenaltyEntry: async (idTenant, idBranch, penalty) => {
        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(new Date()),
            description: `Reconhecimento de multa rescisória: ${penalty.clientName} - Contrato #${penalty.contractId}`,
            sourceType: 'contract_penalty',
            sourceId: penalty.contractId,
            entries: [
                {
                    account: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE,
                    accountName: 'Contas a Receber',
                    debit: penalty.amount,
                    credit: 0
                },
                {
                    account: STANDARD_ACCOUNTS.PENALTY_REVENUE,
                    accountName: 'Receita de Multas e Penalidades',
                    debit: 0,
                    credit: penalty.amount
                }
            ]
        })
    },

    /**
     * Lançamento: Dedução de Receita por Cancelamento (Estorno)
     * Quando: Removemos do AR valores que não serão mais recebidos.
     * D - Deduções de Receita (Contra-receita na DRE)
     * C - Contas a Receber (Ativo)
     */
    createCancellationDeductionEntry: async (idTenant, idBranch, deduction) => {
        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(new Date()),
            description: `Estorno de receita por cancelamento: ${deduction.clientName} - Ref: ${deduction.saleNumber}`,
            sourceType: 'contract_cancel_deduction',
            sourceId: deduction.contractId,
            entries: [
                {
                    account: STANDARD_ACCOUNTS.REVENUE_DEDUCTIONS,
                    accountName: 'Deduções de Receita (Vendas Canceladas)',
                    debit: deduction.amount,
                    credit: 0
                },
                {
                    account: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE,
                    accountName: 'Contas a Receber',
                    debit: 0,
                    credit: deduction.amount
                }
            ]
        })
    },

    /**
     * Lançamento: Recebimento de Venda (Regime de Caixa)
     * Quando: Ao RECEBER o pagamento
     */
    settleReceivableEntry: async (idTenant, idBranch, receivable, settlement) => {
        const { grossAmount, netAmount, feeAmount, idBankAccount, bankAccountName, settlementDate, paymentMethod } = settlement;

        const entries = [
            {
                // DÉBITO: Aumenta o saldo do banco (entrada de dinheiro LÍQUIDA)
                account: idBankAccount,
                accountName: bankAccountName || 'Banco',
                debit: netAmount,
                credit: 0,
                paymentMethod: paymentMethod
            },
            {
                // CRÉDITO: Diminui contas a receber (baixa o direito pelo valor BRUTO)
                account: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE,
                accountName: 'Contas a Receber',
                debit: 0,
                credit: grossAmount
            }
        ]

        // Se tiver taxa de cartão, registra como despesa (DÉBITO)
        if (feeAmount > 0) {
            entries.push({
                account: STANDARD_ACCOUNTS.CARD_FEES,
                accountName: 'Despesa com Taxas de Cartão',
                debit: feeAmount,
                credit: 0
            })
        }

        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(settlementDate) || new Date(),
            description: `Recebimento: ${receivable.description || 'Título'} - Cliente: ${receivable.clientName}`,
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
    },

    /**
     * Lançamento: Movimentação de Caixa (Sangria/Suprimento)
     * Quando: Sangria (retirar dinheiro) ou Suprimento (adicionar dinheiro)
     * 
     * Sangria (withdrawal):
     * D - Banco  R$ 500
     * C - Caixa  R$ 500
     * 
     * Suprimento (supply):
     * D - Caixa  R$ 500
     * C - Banco  R$ 500
     */
    createCashierMovement: async (idTenant, idBranch, movement) => {
        const isWithdrawal = movement.type === 'withdrawal'

        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(movement.date) || new Date(),
            description: isWithdrawal
                ? `Sangria de caixa: ${movement.description}`
                : `Suprimento de caixa: ${movement.description}`,
            sourceType: 'cashier_movement',
            sourceId: movement.id,
            entries: [
                {
                    account: isWithdrawal ? movement.idBankAccount : STANDARD_ACCOUNTS.CASH,
                    accountName: isWithdrawal ? movement.bankAccountName : 'Caixa',
                    debit: movement.amount,
                    credit: 0
                },
                {
                    account: isWithdrawal ? STANDARD_ACCOUNTS.CASH : movement.idBankAccount,
                    accountName: isWithdrawal ? 'Caixa' : movement.bankAccountName,
                    debit: 0,
                    credit: movement.amount
                }
            ]
        })
    },

    /**
     * Lançamento: Transferência entre Contas Bancárias
     * Quando: Transferir dinheiro de um banco para outro
     * 
     * D - Banco Destino   R$ 1.000
     * C - Banco Origem    R$ 1.000
     */
    createBankTransfer: async (idTenant, idBranch, transfer) => {
        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(transfer.date) || new Date(),
            description: `Transferência: ${transfer.fromBankName} → ${transfer.toBankName}`,
            sourceType: 'bank_transfer',
            sourceId: transfer.id,
            entries: [
                {
                    // DÉBITO: Aumenta saldo do banco destino
                    account: transfer.idBankAccountTo,
                    accountName: transfer.toBankName,
                    debit: transfer.amount,
                    credit: 0
                },
                {
                    // CRÉDITO: Diminui saldo do banco origem
                    account: transfer.idBankAccountFrom,
                    accountName: transfer.fromBankName,
                    debit: 0,
                    credit: transfer.amount
                }
            ]
        })
    },

    /**
     * Lançamento: Tarifa Bancária
     * Quando: Banco cobra tarifa
     * 
     * D - Despesa com Tarifas  R$ 15
     * C - Banco                R$ 15
     */
    createBankFee: async (idTenant, idBranch, fee) => {
        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(fee.date) || new Date(),
            description: `Tarifa bancária: ${fee.description}`,
            sourceType: 'bank_fee',
            sourceId: fee.id,
            entries: [
                {
                    // DÉBITO: Despesa com tarifas (vai para DRE)
                    account: STANDARD_ACCOUNTS.BANK_FEES,
                    accountName: 'Despesa com Tarifas Bancárias',
                    debit: fee.amount,
                    credit: 0
                },
                {
                    // CRÉDITO: Diminui saldo do banco
                    account: fee.idBankAccount,
                    accountName: fee.bankAccountName,
                    debit: 0,
                    credit: fee.amount
                }
            ]
        })
    },

    /**
     * Lançamento: Saldo Inicial ou Ajuste de Conta Bancária
     * Quando: Ao cadastrar uma conta com saldo ou ajustar manualmente
     */
    createOpeningBalanceEntry: async (idTenant, idBranch, idAccount, accountName, amount, isAdjustment = false) => {
        const isPositive = amount >= 0;
        const absAmount = Math.abs(amount);

        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(new Date()),
            description: isAdjustment ? `Ajuste de Saldo - ${accountName}` : `Saldo Inicial - ${accountName}`,
            sourceType: isAdjustment ? 'balance_adjustment' : 'opening_balance',
            sourceId: idAccount,
            entries: [
                {
                    // DÉBITO: Se positivo, aumenta o banco. Se negativo, diminui (Crédito).
                    // Aqui inverte a lógica pois o Ledger espera Debit/Credit colunas
                    account: STANDARD_ACCOUNTS.BANK_ACCOUNTS,
                    accountName: accountName,
                    debit: isPositive ? absAmount : 0,
                    credit: !isPositive ? absAmount : 0,
                },
                {
                    // CONTRA-PARTIDA: PL
                    account: STANDARD_ACCOUNTS.EQUITY_ADJUSTMENTS,
                    accountName: 'Ajustes de Saldo / Capital',
                    debit: !isPositive ? absAmount : 0, // Se banco diminuiu, PL diminui (Débito)
                    credit: isPositive ? absAmount : 0, // Se banco aumentou, PL aumenta (Crédito)
                }
            ]
        })
    },

    /**
     * Lançamento: Recebimento de Venda à Vista (Dinheiro/PIX)
     * Quando: Pagamento imediato no PDV
     * 
     * D - Caixa/Banco
     * C - Contas a Receber (baixa o direito criado na Venda)
     */
    registerSalePayment: async (idTenant, idBranch, { saleId, saleNumber, paymentMethod, amount, bankAccountId, bankAccountName }) => {
        let debitAccount = STANDARD_ACCOUNTS.CASH;
        let debitAccountName = 'Caixa';

        // Se for PIX ou Transferência, idealmente iria para o Banco
        // Mas se o sistema ainda joga PIX no "Caixa" (CashierService), mantemos Caixa aqui ou ajustamos no futuro.
        // O SalesService atual joga PIX no CashierService, então contabilmente é "Caixa" (Gaveta Virtual de PIX) ou Banco?
        // Vamos assumir que PIX cai na conta bancária se tiver o ID, senão cai no "Banco Genérico"
        if (paymentMethod === 'pix' || paymentMethod === 'transfer' || bankAccountId) {
            // Se tiver bankAccountId real, usa. Se não, usa o Genérico de Ativo Circulante Bancos
            // ATENÇÃO: Se não tiver conta bancária cadastrada para o PIX, isso gera uma pendência de conciliação.
            debitAccount = bankAccountId || STANDARD_ACCOUNTS.BANK_ACCOUNTS;
            debitAccountName = bankAccountName || 'Conta Bancária (PIX)';
        }

        return await ledgerRepository.create(idTenant, idBranch, {
            date: normalizeDate(new Date()),
            description: `Recebimento à Vista (${paymentMethod}): Venda #${saleNumber}`,
            sourceType: 'sale_payment_instant',
            sourceId: saleId,
            entries: [
                {
                    // DÉBITO: Entrada no Caixa/Banco
                    account: debitAccount,
                    accountName: debitAccountName,
                    debit: amount,
                    credit: 0
                },
                {
                    // CRÉDITO: Baixa do Contas a Receber (criado na venda)
                    account: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE,
                    accountName: 'Contas a Receber',
                    debit: 0,
                    credit: amount
                }
            ]
        })
    }
}

/**
 * Wrapper seguro para chamadas ao Ledger.
 * 
 * Executa a função contábil e, se falhar, persiste o erro no Firestore
 * para correção posterior. NUNCA bloqueia a operação financeira principal.
 * 
 * @param {string} idTenant
 * @param {string} idBranch
 * @param {Function} ledgerFn - Função async que faz o lançamento contábil
 * @param {Object} context - Dados de contexto para diagnóstico (sourceType, sourceId, etc)
 * @returns {Promise<{ success: boolean, error?: string }>}
 * 
 * @example
 * await safeLedgerCall(idTenant, idBranch,
 *   () => LedgerService.createPayableEntry(idTenant, idBranch, payable),
 *   { sourceType: 'payable', sourceId: payable.id, operation: 'createPayableEntry' }
 * );
 */
export const safeLedgerCall = async (idTenant, idBranch, ledgerFn, context = {}) => {
    try {
        await ledgerFn();
        return { success: true };
    } catch (ledgerError) {
        const errorMessage = ledgerError?.message || String(ledgerError);
        console.error(`[Ledger] Erro contábil em ${context.operation || 'unknown'}:`, errorMessage);

        // Persistir o erro para correção posterior
        try {
            await ledgerErrorRepository.create(idTenant, idBranch, {
                operation: context.operation || 'unknown',
                sourceType: context.sourceType || null,
                sourceId: context.sourceId || null,
                errorMessage: errorMessage,
                context: JSON.stringify(context),
                resolvedAt: null
            });
        } catch (persistError) {
            // Se nem salvar o erro consegue, loga tudo no console
            console.error('[Ledger] Falha ao persistir erro contábil:', persistError);
        }

        return { success: false, error: errorMessage };
    }
};
