const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * ============================================================================
 * ATTENDANCE TRIGGERS (MONTHLY STATS)
 * ____________________________________________________________________________
 *
 * 1. onAttendanceWrite: Recalcula totais mensais (presenças/faltas) quando muda.
 *
 * ============================================================================
 */

const { toMonthKey } = require("./helpers/utils");
const { recomputeClientMonthSummary } = require("./helpers/monthlySummary");

exports.onAttendanceWrite = functions
  .region("us-central1")
  .firestore
  .document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/attendance/{idSession}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch, idClient } = context.params;

    const after = change.after.exists ? (change.after.data() || {}) : null;
    const before = change.before.exists ? (change.before.data() || {}) : null;

    const sessionDate = (after && after.sessionDate) || (before && before.sessionDate) || null;
    const monthKey = toMonthKey(String(sessionDate || ""));
    if (!monthKey) return null;

    await recomputeClientMonthSummary({ idTenant, idBranch, idClient, monthKey });
    return null;
  });
