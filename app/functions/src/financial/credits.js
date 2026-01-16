const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { requireAuthContext } = require("../shared/context");
const { saveAuditLog } = require("../shared/audit");

const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

// Helper to get credits collection
const getCreditsColl = (idTenant, idBranch, idClient) =>
  db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient).collection("credits");

// ============================================================================
// INTERNAL HELPERS (Funções Internas)
// ============================================================================

/**
 * Função interna para adicionar crédito.
 * Suporta batch opcional.
 * Utilizada por esta e outras functions (ex: vendas).
 */
const addClientCreditInternal = async ({ idTenant, idBranch, idClient, payload, uid, userToken, batch }) => {
  const finalPayload = {
    idTenant,
    idBranch,
    idClient,
    origin: payload.origin || "sale",
    idSale: payload.idSale || null,
    amount: Number(payload.amount || 0),
    balance: Number(payload.amount || 0),
    description: payload.description || "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    createdByName: userToken?.name || userToken?.email || "System",
  };

  const ref = getCreditsColl(idTenant, idBranch, idClient).doc(); // Auto ID

  if (batch) {
    batch.set(ref, finalPayload);
    return { id: ref.id, ...finalPayload };
  } else {
    await ref.set(finalPayload);
    return { id: ref.id, ...finalPayload };
  }
};

// ============================================================================
// CALLABLES (Funções chamadas pelo Frontend)
// ============================================================================

/**
 * Função Callable para ADICIONAR CRÉDITO.
 * Nome: addClientCredit
 *
 * Função:
 * 1. Valida valor positivo.
 * 2. Adiciona registro de crédito ao cliente.
 */
exports.addClientCredit = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);

  const { idClient, amount } = data;
  const creditAmount = Number(amount);

  if (!idClient) {
    throw new functions.https.HttpsError("invalid-argument", "ID do cliente é obrigatório.");
  }
  if (!creditAmount || creditAmount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "O valor do crédito deve ser positivo.");
  }

  try {
    const result = await addClientCreditInternal({
      idTenant,
      idBranch,
      idClient,
      payload: data,
      uid,
      userToken: token,
    });

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch, uid,
      action: "FINANCIAL_CREDIT_ADD",
      targetId: idClient,
      description: `Adicionou R$ ${creditAmount.toFixed(2)} em crédito para o cliente ${idClient}`,
      metadata: { idClient, amount: creditAmount, reason: data.description }
    });

    return result;
  } catch (error) {
    console.error("Erro ao adicionar crédito ao cliente:", error);
    throw new functions.https.HttpsError("internal", "Erro ao salvar crédito.");
  }
});

exports.addClientCreditInternal = addClientCreditInternal;

/**
 * Consome saldo de um crédito do cliente.
 */
exports.consumeClientCredit = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idClient, idCredit, amount } = data;
  const value = Number(amount || 0);

  if (!idClient || !idCredit) throw new functions.https.HttpsError("invalid-argument", "IDs obrigatórios.");
  if (value <= 0) throw new functions.https.HttpsError("invalid-argument", "Valor a consumir deve ser positivo.");

  const ref = getCreditsColl(idTenant, idBranch, idClient).doc(idCredit);

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Crédito não encontrado.");

      const currentBalance = Number(snap.data().balance || 0);
      if (currentBalance < value) {
        throw new functions.https.HttpsError("failed-precondition", "Saldo insuficiente neste crédito.");
      }

      t.update(ref, {
        balance: FieldValue.increment(-value),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      });
    });

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch, uid,
      action: "FINANCIAL_CREDIT_CONSUME",
      targetId: idClient,
      description: `Consumiu R$ ${value.toFixed(2)} de crédito do cliente ${idClient}`,
      metadata: { idClient, idCredit, amount: value }
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao consumir crédito:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Erro ao consumir crédito.");
  }
});

/**
 * Remove um crédito (operação administrativa).
 */
exports.deleteClientCredit = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const { idClient, idCredit } = data;

  if (!idClient || !idCredit) throw new functions.https.HttpsError("invalid-argument", "IDs obrigatórios.");

  const ref = getCreditsColl(idTenant, idBranch, idClient).doc(idCredit);

  try {
    await ref.delete();

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch,
      uid: context.auth.uid,
      action: "FINANCIAL_CREDIT_DELETE",
      targetId: idClient,
      description: `Removeu registro de crédito ${idCredit} do cliente ${idClient}`
    });

    return { success: true, id: idCredit };
  } catch (error) {
    console.error("Erro ao remover crédito:", error);
    throw new functions.https.HttpsError("internal", "Erro ao remover crédito.");
  }
});
