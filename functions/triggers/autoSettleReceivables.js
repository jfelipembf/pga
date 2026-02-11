
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Inicialização segura
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Liquidação Automática de Recebíveis de Cartão (Adquirentes)
 * Roda diariamente às 04:00 da manhã.
 * 
 * Verifica recebíveis do tipo 'acquirer' que estão 'open' e venceram (dueDate <= hoje).
 * Realiza a baixa (status='paid') e, idealmente, criaria a transação de entrada se tivéssemos a lógica completa aqui.
 * Por segurança, apenas marcamos como PAGO para atualizar o Dashboard de "Contas a Receber".
 * A criação de Transação exige cuidado com contas bancárias e conciliação.
 */
module.exports = onSchedule({
    schedule: "0 4 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
}, async (event) => {
    const db = admin.firestore();
    const now = FieldValue.serverTimestamp(); // Para update/create
    const queryDate = new Date(); // Para a query (agora)

    logger.info("[autoSettleReceivables] Iniciando processamento de baixas automáticas...");

    try {
        // 1. Iterar Tenants para respeitar isolamento e buscar configs
        const tenantsSnap = await db.collection('tenants').get();

        let totalProcessed = 0;
        let totalErrors = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const branchesSnap = await tenantDoc.ref.collection('branches').get();

            for (const branchDoc of branchesSnap.docs) {
                try {
                    // Carregar Adquirentes deste Branch para saber a conta bancária
                    const acquirersSnap = await branchDoc.ref.collection('acquirers')
                        .where('status', '==', 'active')
                        .get();

                    const acquirerMap = {}; // ID -> { bankAccountId, bankAccountName }
                    acquirersSnap.forEach(doc => {
                        const data = doc.data();
                        acquirerMap[doc.id] = {
                            bankAccountId: data.bankAccountId,
                            bankAccountName: data.bankAccountName,
                            name: data.name
                        };
                        // Mapear também pelo nome do provider se ID falhar
                        if (data.name) {
                            acquirerMap[data.name.toLowerCase()] = acquirerMap[doc.id];
                        }
                    });

                    // Query: Recebíveis abertos, cartões, vencidos
                    // Usamos Collection simples dentro do branch
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

                        // Tentar identificar conta destino
                        let bankAccountId = null;
                        let bankAccountName = 'Conta Adquirente';

                        // Tenta pelo ID da Adquirente salvo no Recebível
                        if (rec.idAcquirer && acquirerMap[rec.idAcquirer]) {
                            bankAccountId = acquirerMap[rec.idAcquirer].bankAccountId;
                            bankAccountName = acquirerMap[rec.idAcquirer].bankAccountName;
                        }
                        // Tenta pelo nome do provider
                        else if (rec.provider && acquirerMap[rec.provider.toLowerCase()]) {
                            bankAccountId = acquirerMap[rec.provider.toLowerCase()].bankAccountId;
                            bankAccountName = acquirerMap[rec.provider.toLowerCase()].bankAccountName;
                        }

                        // Atualiza Recebível para PAID
                        batch.update(recDoc.ref, {
                            status: 'paid',
                            settlementDate: now,
                            paid: rec.netAmount || rec.amount, // Assume valor líquido correto
                            pending: 0,
                            updatedAt: now,
                            autoSettled: true,
                            destinationBankAccountId: bankAccountId // Rastreabilidade
                        });

                        // Opcional: Criar Transação de Entrada (Income) no 'transactions'
                        // Isso é fundamental para aparecer no CashFlow como "Realizado"
                        if (bankAccountId) { // Só cria se tiver conta válida para não poluir
                            const transactionRef = branchDoc.ref.collection('transactions').doc();
                            batch.set(transactionRef, {
                                type: 'income',
                                amount: parseFloat(rec.netAmount || rec.amount),
                                category: 'Recebimento Cartão',
                                description: `Baixa Automática: ${rec.description || 'Cartão'}`,
                                method: rec.paymentMethod || 'credit_card',
                                date: now,
                                idBankAccount: bankAccountId,
                                bankAccountName: bankAccountName,
                                idReceivable: recDoc.id,
                                createdAt: now,
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

        logger.info(`[autoSettleReceivables] Concluído. Processados: ${totalProcessed}. Erros: ${totalErrors}.`);

    } catch (error) {
        logger.error("[autoSettleReceivables] Erro fatal:", error);
    }
});
