const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const db = admin.firestore();

/**
 * ============================================================================
 * ATTENDANCE ACTIONS
 * ____________________________________________________________________________
 *
 * 1. markAttendance: Registra presença/falta de um aluno em determinada sessão.
 * 2. saveSessionSnapshot: Salva o resumo (snapshot) de quem estava presente.
 * 3. addExtraParticipantToSession: Adiciona aluno avulso/extra na sessão.
 *
 * ============================================================================
 */

/**
 * Registra a presença de um aluno em uma sessão específica.
 * Salva no histórico do cliente e também prepara para o snapshot da sessão.
 */
exports.markAttendance = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idClient, idSession, idClass, sessionDate, status, justification, type } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idClient || !idSession) {
      throw new functions.https.HttpsError("invalid-argument", "idClient e idSession são obrigatórios");
    }

    const attendanceRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("clients")
      .doc(idClient)
      .collection("attendance")
      .doc(String(idSession));

    const payload = {
      idSession,
      idClass,
      sessionDate,
      status: status || "present",
      justification: justification || "",
      type: type || null,
      idTenant,
      idBranch,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await attendanceRef.set(
      {
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { id: String(idSession), ...payload };
  });

/**
 * Salva o Snapshot de presença na Sessão.
 */
exports.saveSessionSnapshot = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idSession, clients, presentCount, absentCount } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idSession) {
      throw new functions.https.HttpsError("invalid-argument", "idSession é obrigatório");
    }

    const sessionRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("sessions")
      .doc(idSession);

    const payload = {
      attendanceRecorded: true,
      attendanceSnapshot: clients || [],
      presentCount: presentCount || 0,
      absentCount: absentCount || 0,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await sessionRef.set(
      {
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  });

/**
 * Adiciona um participante extra à sessão.
 */
exports.addExtraParticipantToSession = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idSession, participant } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idSession) {
      throw new functions.https.HttpsError("invalid-argument", "idSession é obrigatório");
    }

    if (!participant?.idClient) {
      throw new functions.https.HttpsError("invalid-argument", "participant.idClient é obrigatório");
    }

    const sessionRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("sessions")
      .doc(String(idSession));
    const snap = await sessionRef.get();
    const existing = snap.exists() ? (snap.data()?.extraParticipants || []) : [];
    const idClient = String(participant.idClient);

    const next = [
      ...existing.filter((p) => String(p?.idClient) !== idClient),
      { ...participant, idClient, addedAt: new Date().toISOString() },
    ];

    await sessionRef.set(
      {
        extraParticipants: next,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return next;
  });
