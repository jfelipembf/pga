const functions = require("firebase-functions/v1");
const { handleEnrollmentBump } = require("./helpers/occupancyHelper");

/**
 * ============================================================================
 * OCCUPANCY TRIGGERS (Ocupação de Turmas)
 * ____________________________________________________________________________
 *
 * 1. onCreate: Aumenta ocupação ao criar matrícula.
 * 2. onUpdate: Ajusta ocupação ao mudar status da matrícula.
 * 3. onDelete: Diminui ocupação ao remover matrícula.
 *
 * ============================================================================
 */

module.exports = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onCreate(async (snap) => {
    const enrollment = snap.data() || {};
    const status = (enrollment.status || "").toLowerCase();
    if (status && status !== "active") return null;

    const updated = await handleEnrollmentBump({ enrollment, delta: 1 });
    functions.logger.info("enrollment.onCreate bump", {
      type: enrollment.type,
      idTenant: enrollment.idTenant,
      idBranch: enrollment.idBranch,
      updated,
    });
    return null;
  });

module.exports.onUpdate = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const idEnrollment = context.params.idEnrollment;

    const statusBefore = (before.status || "").toLowerCase();
    const statusAfter = (after.status || "").toLowerCase();

    const activeBefore = statusBefore === "active";
    const activeAfter = statusAfter === "active";

    // Se o status de ativo mudou
    if (activeBefore !== activeAfter) {
      // Se ativou: +1. Se desativou: -1.
      const delta = activeAfter ? 1 : -1;

      // Usa o enrollment 'after' para pegar dados atuais.
      // Passamos isUpdate: true para garantir que normalizeStart use 'today'.
      const updated = await handleEnrollmentBump({ enrollment: after, delta, isUpdate: true });

      functions.logger.info("enrollment.onUpdate occupancy bump result", {
        type: after.type,
        idTenant: after.idTenant,
        idBranch: after.idBranch,
        delta,
        updated,
      });
    }

    return null;
  });

module.exports.onDelete = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onDelete(async (snap) => {
    const enrollment = snap.data() || {};
    const status = (enrollment.status || "").toLowerCase();
    if (status && status !== "active") return null;

    const updated = await handleEnrollmentBump({ enrollment, delta: -1 });
    functions.logger.info("enrollment.onDelete bump", {
      type: enrollment.type,
      idTenant: enrollment.idTenant,
      idBranch: enrollment.idBranch,
      updated,
    });
    return null;
  });
