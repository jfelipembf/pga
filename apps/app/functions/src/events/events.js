const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { saveAuditLog } = require("../shared/audit");

/**
 * Cria um evento.
 */
exports.createEvent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, eventData, id } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!eventData) {
      throw new functions.https.HttpsError("invalid-argument", "eventData é obrigatório");
    }

    const eventsCol = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("events");
    const eventRef = id ? eventsCol.doc(id) : eventsCol.doc();

    const payload = {
      ...eventData,
      idTenant,
      idBranch,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await eventRef.set(payload, { merge: true });

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch,
      uid: context.auth.uid,
      action: "EVENT_CREATE",
      targetId: eventRef.id,
      description: `Criou/Atualizou evento: ${eventData.title || eventRef.id}`,
      metadata: { title: eventData.title }
    });

    return { id: eventRef.id, ...payload };
  });

/**
 * Atualiza um evento.
 */
exports.updateEvent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, id, eventData } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!id) {
      throw new functions.https.HttpsError("invalid-argument", "id do evento é obrigatório");
    }

    if (!eventData) {
      throw new functions.https.HttpsError("invalid-argument", "eventData é obrigatório");
    }

    const eventRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("events")
      .doc(id);

    const payload = {
      ...eventData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await eventRef.update(payload);

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch,
      uid: context.auth.uid,
      action: "EVENT_UPDATE",
      targetId: id,
      description: `Atualizou evento: ${id}`,
      metadata: { updates: Object.keys(eventData) }
    });

    return { id, ...payload };
  });

/**
 * Deleta um evento.
 */
exports.deleteEvent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, id } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!id) {
      throw new functions.https.HttpsError("invalid-argument", "id do evento é obrigatório");
    }

    const eventRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("events")
      .doc(id);
    await eventRef.delete();

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch,
      uid: context.auth.uid,
      action: "EVENT_DELETE",
      targetId: id,
      description: `Removeu evento: ${id}`
    });

    return { success: true };
  });
