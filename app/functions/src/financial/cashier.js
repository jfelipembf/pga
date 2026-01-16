const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");

const db = admin.firestore();

// Helper para obter coleção (se mantido aqui por simplicidade)
const getSessionsColl = (idTenant, idBranch) =>
  db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("cashierSessions");

// ============================================================================
// CALLABLES (Funções chamadas pelo Frontend)
// ============================================================================

/**
 * Função Callable para ABRIR Caixa.
 * Nome: openCashier
 *
 * Função:
 * 1. Verifica saldo inicial positivo.
 * 2. Verifica se já existe um caixa aberto na unidade.
 * 3. Cria nova sessão de caixa com status 'open'.
 */
exports.openCashier = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const openingBalance = Number(data.openingBalance || 0);

  if (openingBalance < 0) {
    throw new functions.https.HttpsError("invalid-argument", "O saldo inicial não pode ser negativo.");
  }

  const sessionsRef = getSessionsColl(idTenant, idBranch);

  // 1. Verificar se já existe caixa aberto
  // Nota: Idealmente isso seria uma transação, mas para simplificar e reduzir custos de leitura em alta concorrência (raro aqui),
  // fazemos uma query simples. O risco de race condition é baixo para um caixa físico por branch.
  const openSnapshot = await sessionsRef
    .where("status", "==", "open")
    .limit(1)
    .get();

  if (!openSnapshot.empty) {
    throw new functions.https.HttpsError("failed-precondition", "Já existe um caixa aberto nesta unidade.");
  }

  // 2. Criar nova sessão
  const newSession = {
    status: "open",
    openingBalance,
    currentBalance: openingBalance,
    openedAt: FieldValue.serverTimestamp(),
    closedAt: null,
    responsible: token.name || token.email || "Usuário",
    idStaff: uid,
    idTenant,
    idBranch,
  };

  try {
    const docRef = await sessionsRef.add(newSession);
    return {
      success: true,
      id: docRef.id,
      ...newSession,
      openedAt: new Date().toISOString(), // Retorna string para o cliente não quebrar com Timestamp
    };
  } catch (error) {
    console.error("Erro ao abrir caixa:", error);
    throw new functions.https.HttpsError("internal", "Erro ao criar sessão de caixa.");
  }
});

/**
 * Função Callable para FECHAR Caixa.
 * Nome: closeCashier
 *
 * Função:
 * 1. Verifica se a sessão existe e está aberta.
 * 2. Atualiza status para 'closed' com data de fechamento e observações.
 * 3. Registra saldo final.
 */
exports.closeCashier = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const { idSession, observations } = data;
  const closingBalance = Number(data.closingBalance || 0);

  if (!idSession) {
    throw new functions.https.HttpsError("invalid-argument", "ID da sessão é obrigatório.");
  }

  const sessionRef = getSessionsColl(idTenant, idBranch).doc(idSession);

  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(sessionRef);

      if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "Sessão de caixa não encontrada.");
      }

      const sessionData = doc.data();

      if (sessionData.status !== "open") {
        throw new functions.https.HttpsError("failed-precondition", "Este caixa já está fechado.");
      }

      t.update(sessionRef, {
        status: "closed",
        closedAt: FieldValue.serverTimestamp(),
        closingBalance,
        observations: observations || "",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true, message: "Caixa fechado com sucesso." };
  } catch (error) {
    console.error("Erro ao fechar caixa:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Erro ao processar fechamento do caixa.");
  }
});
