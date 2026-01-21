const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");
const { saveAuditLog } = require("../shared/audit");
const { generateEntityId } = require("../shared/id");
const { toISODate } = require("../shared");
const { createTransactionInternal } = require("./transactions");

const db = admin.firestore();

/**
 * ============================================================================
 * CENTRALIZED FINANCIAL CANCELLATION LOGIC
 * ____________________________________________________________________________
 * 
 * Este módulo centraliza a lógica contábil para cancelamentos de vendas e contratos.
 * Lida com dois cenários principais:
 * 1. Cancelamento de Dívida (Inadimplência/Aberto): Baixa de recebíveis.
 * 2. Estorno de Pagamento (Cartão/Pago): Geração de transação de saída (reembolso) ou crédito.
 * 
 * ============================================================================
 */

/**
 * Analisa os impactos financeiros de um cancelamento.
 * Retorna o que está em aberto (para cancelar) e o que foi pago (para estornar/reter).
 */
exports.analyzeCancellationImpact = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch } = requireAuthContext(data, context);
    const { idContract, idSale } = data;

    if (!idContract && !idSale) {
        throw new functions.https.HttpsError("invalid-argument", "Forneça idContract ou idSale.");
    }

    try {
        const receivablesRef = db
            .collection(`tenants/${idTenant}/branches/${idBranch}/receivables`);

        let queryRef = receivablesRef;
        if (idSale) {
            queryRef = queryRef.where("idSale", "==", idSale);
        } else {
            queryRef = queryRef.where("idContract", "==", idContract);
        }

        const snapshot = await queryRef.get();

        let openAmount = 0;
        let paidAmount = 0;
        let openItems = [];
        let paidItems = [];

        snapshot.forEach(doc => {
            const r = doc.data();
            const status = (r.status || "").toLowerCase();

            if (status === "open" || status === "overdue" || status === "pending") {
                openAmount += Number(r.pending || 0);
                openItems.push({ id: doc.id, ...r });
            } else if (status === "paid") {
                paidAmount += Number(r.paid || 0);
                paidItems.push({ id: doc.id, ...r });
            }
        });

        // Buscar transações financeiras (ex: cartão) que podem não ter gerado recebível ou já baixaram
        // Se a venda foi direta no cartão, pode estar apenas em transactions
        // ... (Lógica expandida: buscar transactions vinculadas idSale) ...

        return {
            openDebt: {
                amount: openAmount,
                count: openItems.length,
                description: "Valores em aberto (Faturas/Boletos) que podem ser cancelados."
            },
            paidAmount: {
                amount: paidAmount,
                count: paidItems.length,
                description: "Valores já pagos (Cartão/Dinheiro). Requer decisão: Estornar ou Reter (Multa)?"
            }
        };

    } catch (error) {
        console.error("Erro ao analisar impacto:", error);
        throw new functions.https.HttpsError("internal", "Erro ao analisar cancelamento.");
    }
});

/**
 * Executa o cancelamento financeiro.
 * 1. Cancela recebíveis em aberto.
 * 2. Opcional: Registra estorno para valores pagos.
 */
exports.processFinancialCancellation = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
    const {
        idContract,
        idSale,
        actionOpen, // 'cancel' | 'keep'
        actionPaid, // 'refund' | 'credit' | 'keep'
        refundAmount, // Se for parcial
        refundMethod // 'pix', 'cash', 'card_reversal'
    } = data;

    // ... Validações ...

    const batch = db.batch();
    const receivablesRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/receivables`);

    // Busca itens
    let queryRef = receivablesRef;
    if (idSale) {
        queryRef = queryRef.where("idSale", "==", idSale);
    } else {
        queryRef = queryRef.where("idContract", "==", idContract);
    }
    const snapshot = await queryRef.get();

    // 1. Processar Abertos
    if (actionOpen === 'cancel') {
        snapshot.docs.forEach(doc => {
            const r = doc.data();
            if (['open', 'overdue', 'pending'].includes(r.status)) {
                batch.update(doc.ref, {
                    status: 'canceled',
                    canceledAt: FieldValue.serverTimestamp(),
                    canceledBy: uid,
                    cancelReason: 'Cancelamento Contratual (Centralizado)'
                });
            }
        });
    }

    // 2. Processar Pagos (Reembolso)
    let refundResult = null;
    if (actionPaid === 'refund' && refundAmount > 0) {
        // Criar transação de SAÍDA (Despesa/Estorno)
        const payload = {
            type: "expense",
            category: "Estorno de Venda",
            description: `Reembolso ref. Cancelamento Contrato/Venda ${idContract || idSale}`,
            amount: Number(refundAmount), // Valor positivo aqui, internal trata como debito/expense
            date: toISODate(new Date()),
            method: refundMethod || "Outros",
            idContract,
            idSale,
            metadata: {
                reason: "Refund",
                registeredBy: token?.name || "System"
            }
        };

        const result = await createTransactionInternal({
            idTenant,
            idBranch,
            payload,
            batch // Adicionar ao batch
        });
        refundResult = result; // ID será gerado
    }

    await batch.commit();

    // Auditoria
    await saveAuditLog({
        idTenant, idBranch, uid,
        action: "FINANCIAL_CANCELLATION_PROCESSED",
        targetId: idContract || idSale,
        description: `Processamento financeiro de cancelamento. Abertos: ${actionOpen}. Pagos: ${actionPaid}.`,
        metadata: data
    });

    return { success: true };
});
