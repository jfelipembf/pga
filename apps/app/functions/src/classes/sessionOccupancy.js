const functions = require("firebase-functions/v1");
const { FieldValue } = require("firebase-admin/firestore");

// Shared utilities
const { getBranchCollectionRef } = require("../shared/references");

/**
 * ============================================================================
 * SESSÕES (OCUPAÇÃO)
 * ____________________________________________________________________________
 *
 * 1. incrementSessionOccupancy: Incrementa contador de alunos na sessão.
 * 2. decrementSessionOccupancy: Decrementa contador de alunos na sessão.
 *
 * ============================================================================
 */

/**
 * Helper: Atualiza enrolledCount de uma sessão com transação
 */
const bump = async ({ idTenant, idBranch, idSession, delta }) => {
  const ref = getBranchCollectionRef(idTenant, idBranch, "sessions", idSession);

  await ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Sessão não encontrada");
    }

    const current = snap.data() || {};
    const before = Number(current.enrolledCount || 0);
    const next = Math.max(before + Number(delta || 0), 0);

    tx.update(ref, {
      enrolledCount: next,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return true;
};

/**
 * Incrementa contador de alunos em uma sessão
 */
exports.incrementSessionOccupancy = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Autenticação obrigatória");
    }

    const { idTenant, idBranch, idSession } = data;
    const step = data?.step !== undefined ? Number(data.step) : 1;

    if (!idTenant || !idBranch || !idSession) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "idTenant, idBranch e idSession são obrigatórios"
      );
    }

    await bump({ idTenant, idBranch, idSession, delta: Math.max(step, 1) });
    return { ok: true };
  });

/**
 * Decrementa contador de alunos em uma sessão
 */
exports.decrementSessionOccupancy = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Autenticação obrigatória");
    }

    const { idTenant, idBranch, idSession } = data;
    const step = data?.step !== undefined ? Number(data.step) : 1;

    if (!idTenant || !idBranch || !idSession) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "idTenant, idBranch e idSession são obrigatórios"
      );
    }

    await bump({ idTenant, idBranch, idSession, delta: -Math.max(step, 1) });
    return { ok: true };
  });
