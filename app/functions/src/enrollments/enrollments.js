const functions = require("firebase-functions/v1");
const { deleteEnrollmentInternal, createRecurringEnrollmentInternal, createSingleSessionEnrollmentInternal } = require("./helpers/enrollmentService");

/**
 * ============================================================================
 * ENROLLMENTS ACTIONS (Ações de Matrículas e Agendamentos)
 * ____________________________________________________________________________
 *
 * 1. deleteEnrollment: Remove (soft delete) uma matrícula.
 * 2. createRecurringEnrollment: Cria uma matrícula recorrente (Turma).
 * 3. createSingleSessionEnrollment: Cria uma matrícula avulsa (Experimental/Reposição).
 *
 * ============================================================================
 */

/**
 * Soft delete de uma matrícula (muda status para canceled).
 */
exports.deleteEnrollment = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idEnrollment } = data;

    if (!idTenant || !idBranch || !idEnrollment) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant, idBranch e idEnrollment são obrigatórios");
    }

    try {
      return await deleteEnrollmentInternal({ idTenant, idBranch, idEnrollment });
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      throw new functions.https.HttpsError("internal", error.message || "Erro ao deletar matrícula");
    }
  });

/**
 * Creates a Recurring Enrollment.
 */
exports.createRecurringEnrollment = functions.region("us-central1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in");

  const { idTenant, idBranch } = data;
  const uid = context.auth.uid;

  if (!idTenant || !idBranch || !data.idClient || !data.idClass) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    return await createRecurringEnrollmentInternal({ idTenant, idBranch, uid, data });
  } catch (error) {
    console.error("Error creating recurring enrollment:", error);
    throw new functions.https.HttpsError("internal", "Error creating enrollment");
  }
});

/**
 * Creates a Single Session Enrollment.
 */
exports.createSingleSessionEnrollment = functions.region("us-central1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in");

  const { idTenant, idBranch } = data;
  const uid = context.auth.uid;

  if (!idTenant || !idBranch || !data.idClient || !data.idSession || !data.sessionDate) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    return await createSingleSessionEnrollmentInternal({ idTenant, idBranch, uid, data });
  } catch (error) {
    console.error("Error creating single session enrollment:", error);
    throw new functions.https.HttpsError("internal", "Error creating enrollment");
  }
});
