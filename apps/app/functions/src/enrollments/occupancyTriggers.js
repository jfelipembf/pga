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

const onCreate = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onCreate(async (snap) => {
    const enrollment = snap.data() || {};
    const status = (enrollment.status || "").toLowerCase();

    if (status !== "active") {
      return null;
    }

    const updated = await handleEnrollmentBump({ enrollment, delta: 1 });
    return null;
  });

const onUpdate = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onUpdate(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

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
    }

    return null;
  });

const onDelete = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onDelete(async (snap) => {
    const enrollment = snap.data() || {};
    const status = (enrollment.status || "").toLowerCase();
    if (status && status !== "active") return null;

    const updated = await handleEnrollmentBump({ enrollment, delta: -1 });
    return null;
  });

// Export onCreate as default and others as named exports
module.exports = onCreate;
module.exports.onUpdate = onUpdate;
module.exports.onDelete = onDelete;
