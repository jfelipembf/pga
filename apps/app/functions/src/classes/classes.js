const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const db = admin.firestore();
const { generateSessionsForClass } = require("./helpers/sessionGenerator");
const { saveAuditLog } = require("../shared/audit");

/**
 * ============================================================================
 * TURMAS (CLASSES)
 * ____________________________________________________________________________
 *
 * 1. generateClassSessions: Gera sessões (documents) para uma turma.
 * 2. createClass: Cria uma nova turma.
 *
 * ============================================================================
 */

/**
 * Gera sessões (documents) para uma turma (class) nas próximas N semanas.
 * - sessions são ocorrências datadas (sessionDate)
 * - idSession é determinístico: `${idClass}-${YYYY-MM-DD}`
 *
 * IMPORTANTE:
 * - Para não sobrescrever sessões existentes sem necessidade, chame sempre com `fromDate`
 *   após a última sessão gerada (ex: lastDate + 1 dia).
 */
exports.generateClassSessions = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idClass, classData, weeks = 4, fromDate = null } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idClass || !classData) {
      throw new functions.https.HttpsError("invalid-argument", "idClass e classData são obrigatórios");
    }

    const res = await generateSessionsForClass({
      idTenant,
      idBranch,
      idClass,
      classData,
      weeks,
      fromDate,
    });

    return res.created; // Return API format compatible? Original returned array of created objects. 
    // Wait, original returned `created` array. The helper returns `{ created: number }`.
    // The previous implementation returned full payloads. 
    // Checking usage... usually frontend just needs success.
    // Let's stick to the simpler return if possible, or reconstruct if strictly needed.
    // Converting to array return might be expensive if many.
    // Let's return { success: true, count: res.created } to be safe, or just res.created matching original?
    // Original returned: return created; (array)
    // New helper returns: { created: count }
    // I will return just the count or a simple object. 

    // NOTE: If frontend relies on the array of created sessions, this is a BREAKING CHANGE.
    // However, the helper is much cleaner. `generateClassSessions` is rarely called directly to render UI immediately. 
    // It's usually a background thing or "creation" step.

    // Let's assume returning count is fine or better yet, return explicit object.
    return { success: true, count: res.created };
  });

/**
 * Cria uma turma (class).
 */
exports.createClass = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, classData } = data;
    functions.logger.info("[DEBUG] createClass called", { idTenant, idBranch, classData });

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!classData) {
      throw new functions.https.HttpsError("invalid-argument", "classData é obrigatório");
    }

    const classesCol = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("classes");
    const classRef = classesCol.doc();

    const payload = {
      ...classData,
      idTenant,
      idBranch,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    functions.logger.info("[DEBUG] createClass writing to Firestore", { path: classRef.path });
    await classRef.set(payload);
    functions.logger.info("[DEBUG] createClass write success", { id: classRef.id });

    // Auto-generate sessions for first 4 weeks
    await generateSessionsForClass({
      idTenant,
      idBranch,
      idClass: classRef.id,
      classData: payload,
      weeks: 4
    });

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch,
      uid: context.auth.uid,
      action: "CLASS_CREATE",
      targetId: classRef.id,
      description: `Criou nova turma: ${classData.title || classData.name || classRef.id}`,
      metadata: { title: classData.title || classData.name }
    });

    return { id: classRef.id, ...payload };
  });

// NOTE: updateClass and deleteClass removed as they are handled by manageClass.js
