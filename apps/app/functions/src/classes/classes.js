const functions = require("firebase-functions/v1");
const { FieldValue } = require("firebase-admin/firestore");

// Shared utilities
const { generateSessionsForClass } = require("./helpers/sessionGenerator");
const { saveAuditLog } = require("../shared/audit");
const { validate } = require("../shared/validator");
const { ClassSchema } = require("../shared");
const { getBranchCollectionRef } = require("../shared/references");
const { requireAuthContext } = require("../shared/context");
const { getActorSnapshot, getTargetSnapshot } = require("../shared/snapshots");
const { withMonitoring } = require("../helpers/monitoringHelper");

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
    const { idTenant, idBranch } = requireAuthContext(data, context);

    const { idClass, classData, weeks = 4, fromDate = null } = data;

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

    return { success: true, count: res.created };
  });

/**
 * Cria uma turma (class).
 */
exports.createClass = functions
  .region("us-central1")
  .https.onCall(withMonitoring("createClass", async (data, context) => {
    try {
      const { idTenant, idBranch } = requireAuthContext(data, context);
      const perf = { start: Date.now() };

      if (!data.classData) {
        throw new functions.https.HttpsError("invalid-argument", "classData é obrigatório");
      }

      // 1. Validation
      const valStart = Date.now();
      const validatedData = validate(ClassSchema, data.classData);
      perf.validation = Date.now() - valStart;

      // Get classes collection reference
      const classesCol = getBranchCollectionRef(idTenant, idBranch, "classes");
      const classRef = classesCol.doc();

      const payload = {
        ...validatedData,
        idTenant,
        idBranch,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // 2. Database (Save + Audit)
      const dbStart = Date.now();
      await classRef.set(payload);

      // Audit log (async background to save time? No, keep sync for safety)
      const actor = getActorSnapshot(context.auth);
      const target = getTargetSnapshot("class", { ...payload, id: classRef.id }, classRef.id);

      await saveAuditLog({
        idTenant,
        idBranch,
        action: "CLASS_CREATE",
        actor,
        target,
        description: `Criou nova turma: ${data.classData.title || data.classData.name || classRef.id}`,
        metadata: { title: data.classData.title || data.classData.name }
      });
      perf.database = Date.now() - dbStart;

      // 3. Session Generation
      const genStart = Date.now();
      try {
        await generateSessionsForClass({
          idTenant,
          idBranch,
          idClass: classRef.id,
          classData: payload,
          weeks: 26, // 6 months horizon
          fromDate: payload.startDate
        });
      } catch (genError) {
        console.error("Error generating initial sessions synchronously:", genError);
      }
      perf.sessionGen = Date.now() - genStart;
      perf.total = Date.now() - perf.start;

      return { id: classRef.id, ...payload, _perf: perf };
    } catch (error) {
      console.error("Error creating class:", error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", error.message || "Erro interno ao criar turma");
    }
  }));


