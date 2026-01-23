const functions = require("firebase-functions/v1");
const { deleteEnrollmentInternal, createRecurringEnrollmentInternal, createSingleSessionEnrollmentInternal } = require("./helpers/enrollmentService");
const { requireAuthContext } = require("../shared/context");
const { validate } = require("../shared/validator");
const { EnrollmentSchema } = require("../shared");

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
    const { idTenant, idBranch } = requireAuthContext(data, context);
    const { idEnrollment } = data;

    if (!idEnrollment) {
      throw new functions.https.HttpsError("invalid-argument", "idEnrollment é obrigatório");
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
const { withMonitoring } = require("../helpers/monitoringHelper");

/**
 * Creates a Recurring Enrollment.
 */
exports.createRecurringEnrollment = functions.region("us-central1").https.onCall(withMonitoring("createRecurringEnrollment", async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const uid = context.auth.uid;

  try {
    const validatedData = validate(EnrollmentSchema, data);
    return await createRecurringEnrollmentInternal({ idTenant, idBranch, uid, data: validatedData });
  } catch (error) {
    console.error("Error creating recurring enrollment:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Error creating enrollment");
  }
}));

/**
 * Creates a Single Session Enrollment.
 */
exports.createSingleSessionEnrollment = functions.region("us-central1").https.onCall(withMonitoring("createSingleSessionEnrollment", async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const uid = context.auth.uid;

  try {
    const validatedData = validate(EnrollmentSchema, data);
    return await createSingleSessionEnrollmentInternal({ idTenant, idBranch, uid, data: validatedData });
  } catch (error) {
    console.error("Error creating single session enrollment:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Error creating enrollment");
  }
}));
