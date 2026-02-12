
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Inicialização segura
if (!admin.apps.length) {
    admin.initializeApp();
}

// Constantes Contábeis (replicando STANDARD_ACCOUNTS do LedgerService.js)
const STANDARD_ACCOUNTS = {
    CARD_FEES: '2.5.3',             // Despesa (DRE)
    CARD_FEES_PROVISION: '4.1.6',   // Provisão (Passivo)
    ACCOUNTS_RECEIVABLE: '3.1.3',   // Contas a Receber (Ativo)
    BANK_ACCOUNTS: '3.1.1'          // Banco (Ativo)
};

// Data de corte para transição do Regime de Caixa para Competência (Mesma do LedgerService)
const ACCRUAL_BASIS_CUTOFF_DATE = new Date('2026-02-11T00:00:00');

/**
 * Liquidação Automática de Recebíveis de Cartão (Adquirentes)
 * Roda diariamente às 04:00 da manhã.
 * 
 * Verifica recebíveis do tipo 'acquirer' que estão 'open' e venceram (dueDate <= hoje).
 * Realiza a baixa (status='paid') E cria o lançamento contábil (Ledger) para consistência total.
 */
module.exports = onSchedule({
    schedule: "0 4 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
}, async (event) => {
    const db = admin.firestore();
    const now = FieldValue.serverTimestamp();
    const queryDate = new Date();

    logger.info("[autoSettleReceivables] Iniciando processamento de baixas automáticas com contabilidade...");

    try {
        const tenantsSnap = await db.collection('tenants').get();
        let totalProcessed = 0;
        let totalErrors = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const branchesSnap = await tenantDoc.ref.collection('branches').get();

            for (const branchDoc of branchesSnap.docs) {
                try {
                    // 1. Mapeamento de Contas Bancárias das Adquirentes
                    const acquirersSnap = await branchDoc.ref.collection('acquirers')
                        .where('status', '==', 'active')
                        .get();

                    const acquirerMap = {};
                    acquirersSnap.forEach(doc => {
                        const data = doc.data();
                        acquirerMap[doc.id] = {
                            bankAccountId: data.bankAccountId,
                            bankAccountName: data.bankAccountName,
                            name: data.name
                        };
                        if (data.name) acquirerMap[data.name.toLowerCase()] = acquirerMap[doc.id];
                    });

                    // 2. Buscar Recebíveis Vencidos
                    const receivablesSnap = await branchDoc.ref.collection('receivables')
                        .where('status', '==', 'open')
                        .where('type', '==', 'acquirer')
                        .where('dueDate', '<=', queryDate)
                        .get();

                    if (receivablesSnap.empty) continue;

                    logger.info(`[autoSettleReceivables] Tenant ${tenantDoc.id} / Branch ${branchDoc.id}: ${receivablesSnap.size} recebíveis vencidos.`);

                    const batch = db.batch();
                    let opCount = 0;

                    for (const recDoc of receivablesSnap.docs) {
                        const rec = recDoc.data();

                        // Validar Conta Bancária Destino
                        let bankAccountId = null;
                        let bankAccountName = 'Conta Adquirente';

                        if (rec.idAcquirer && acquirerMap[rec.idAcquirer]) {
                            bankAccountId = acquirerMap[rec.idAcquirer].bankAccountId;
                            bankAccountName = acquirerMap[rec.idAcquirer].bankAccountName;
                        } else if (rec.provider && acquirerMap[rec.provider.toLowerCase()]) {
                            bankAccountId = acquirerMap[rec.provider.toLowerCase()].bankAccountId;
                            bankAccountName = acquirerMap[rec.provider.toLowerCase()].bankAccountName;
                        }

                        // Calcular valores
                        const grossAmount = parseFloat(rec.amount) || 0;
                        const netAmount = parseFloat(rec.netAmount) || grossAmount;
                        const feeAmount = grossAmount - netAmount;

                        // ATUALIZAÇÃO DO RECEBÍVEL (Status PAID)
                        batch.update(recDoc.ref, {
                            status: 'paid',
                            settlementDate: now,
                            paid: netAmount,
                            pending: 0,
                            updatedAt: now,
                            autoSettled: true,
                            destinationBankAccountId: bankAccountId
                        });

                        // LANÇAMENTO CONTÁBIL (Partidas Dobradas)
                        // Apenas cria se tivermos uma conta bancária destino válida para debitar
                        if (bankAccountId) {
                            // Definir se usa Provisão (Competência) ou Despesa Direta (Caixa/Legado)
                            const saleDate = rec.createdAt && rec.createdAt.toDate ? rec.createdAt.toDate() : new Date(rec.createdAt || 0);
                            const isNewRegime = saleDate >= ACCRUAL_BASIS_CUTOFF_DATE;

                            // Entradas do Lançamento
                            const ledgerEntries = [
                                {
                                    // DÉBITO: Banco (Entrada Líquida)
                                    account: bankAccountId,
                                    accountName: bankAccountName || 'Banco',
                                    debit: netAmount,
                                    credit: 0
                                },
                                {
                                    // CRÉDITO: Contas a Receber (Baixa Bruta)
                                    account: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE,
                                    accountName: 'Contas a Receber',
                                    debit: 0,
                                    credit: grossAmount
                                }
                            ];

                            // Tratar a Taxa (Diferença)
                            if (feeAmount > 0.01) { // Margem de erro float
                                if (isNewRegime) {
                                    // DÉBITO: Baixa da Provisão (Passivo)
                                    ledgerEntries.push({
                                        account: STANDARD_ACCOUNTS.CARD_FEES_PROVISION,
                                        accountName: 'Provisão de Taxas a Liquidar',
                                        debit: feeAmount,
                                        credit: 0
                                    });
                                } else {
                                    // DÉBITO: Despesa Direta (DRE) - Vendas Antigas
                                    ledgerEntries.push({
                                        account: STANDARD_ACCOUNTS.CARD_FEES,
                                        accountName: 'Despesa com Taxas de Cartão',
                                        debit: feeAmount,
                                        credit: 0
                                    });
                                }
                            }

                            // Criar documento no Ledger
                            const ledgerRef = branchDoc.ref.collection('ledger').doc();
                            batch.set(ledgerRef, {
                                date: now,
                                description: `Baixa Automática: ${rec.description || 'Recebimento Cartão'}`,
                                sourceType: 'receivable_settlement_auto',
                                sourceId: recDoc.id,
                                entries: ledgerEntries,
                                createdAt: now
                            });

                            // Opcional: Criar Transação de Fluxo de Caixa (transactions)
                            // Mantemos para compatibilidade com relatórios antigos que leem 'transactions' chamados "Fluxo Diário"
                            const transactionRef = branchDoc.ref.collection('transactions').doc();
                            batch.set(transactionRef, {
                                type: 'income',
                                amount: netAmount,
                                category: 'Recebimento Cartão',
                                description: `Baixa Automática: ${rec.description || 'Cartão'}`,
                                method: rec.paymentMethod || 'credit_card',
                                date: now,
                                idBankAccount: bankAccountId,
                                bankAccountName: bankAccountName,
                                idReceivable: recDoc.id,
                                createdAt: now, // createdAt do Firestore
                                createdBy: 'SYSTEM',
                                isAutoSettlement: true
                            });
                        }

                        opCount++;
                        totalProcessed++;
                    }

                    if (opCount > 0) {
                        await batch.commit();
                    }

                } catch (branchError) {
                    logger.error(`[autoSettleReceivables] Erro no branch ${branchDoc.id}:`, branchError);
                    totalErrors++;
                }
            }
        }

        logger.info(`[autoSettleReceivables] Concluído. Processados com Contabilidade: ${totalProcessed}. Erros: ${totalErrors}.`);

    } catch (error) {
        logger.error("[autoSettleReceivables] Erro fatal:", error);
    }
});
