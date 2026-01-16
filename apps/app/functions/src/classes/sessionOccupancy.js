const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

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

const requireAuth = (context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Auth obrigatório");
  }
};

const requireArgs = ({ idTenant, idBranch, idSession }) => {
  if (!idTenant || !idBranch || !idSession) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "idTenant, idBranch e idSession são obrigatórios",
    );
  }
};

const sessionRef = ({ idTenant, idBranch, idSession }) =>
  db.collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("sessions")
    .doc(idSession);

const bump = async ({ idTenant, idBranch, idSession, delta }) => {
  const ref = sessionRef({ idTenant, idBranch, idSession });

  await db.runTransaction(async (tx) => {
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

exports.incrementSessionOccupancy = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    requireAuth(context);
    const idTenant = data?.idTenant ? String(data.idTenant) : null;
    const idBranch = data?.idBranch ? String(data.idBranch) : null;
    const idSession = data?.idSession ? String(data.idSession) : null;
    const step = data?.step !== undefined ? Number(data.step) : 1;

    requireArgs({ idTenant, idBranch, idSession });

    await bump({ idTenant, idBranch, idSession, delta: Math.max(step, 1) });
    return { ok: true };
  });

exports.decrementSessionOccupancy = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    requireAuth(context);
    const idTenant = data?.idTenant ? String(data.idTenant) : null;
    const idBranch = data?.idBranch ? String(data.idBranch) : null;
    const idSession = data?.idSession ? String(data.idSession) : null;
    const step = data?.step !== undefined ? Number(data.step) : 1;

    requireArgs({ idTenant, idBranch, idSession });

    await bump({ idTenant, idBranch, idSession, delta: -Math.max(step, 1) });
    return { ok: true };
  });
