const functions = require("firebase-functions/v1");
const { generateSessionsForClass } = require("./helpers/sessionGenerator");

/**
 * ============================================================================
 * SESSÕES (TRIGGER)
 * ____________________________________________________________________________
 *
 * 1. generateSessionsOnClassCreate: Trigger para gerar sessões ao criar turma.
 *
 * ============================================================================
 */

module.exports = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/classes/{idClass}")
  .onCreate(async (snap, context) => {
    const { idTenant, idBranch, idClass } = context.params;
    functions.logger.info("[DEBUG] generateSessionsOnClassCreate TRIGGERED", { idClass, idTenant, idBranch });

    const classData = snap.data() || {};

    // Debug: Log the full classData to see what we're working with
    functions.logger.info("[DEBUG] classData received:", {
      weekday: classData.weekday,
      startDate: classData.startDate,
      endDate: classData.endDate,
      startTime: classData.startTime,
    });

    const fromDate = classData.startDate || new Date();
    const result = await generateSessionsForClass({
      idTenant,
      idBranch,
      idClass,
      classData,
      weeks: 26, // 6 months (approx 26 weeks)
      fromDate,
    });

    functions.logger.info("generateSessionsOnClassCreate RESULT", {
      idTenant,
      idBranch,
      idClass,
      created: result.created,
    });

    return null;
  });
