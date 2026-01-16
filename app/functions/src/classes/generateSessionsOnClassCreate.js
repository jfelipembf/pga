const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
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

// ... (code omitted)

module.exports = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/classes/{idClass}")
  .onCreate(async (snap, context) => {
    const { idTenant, idBranch, idClass } = context.params;
    functions.logger.info("[DEBUG] generateSessionsOnClassCreate TRIGGERED", { idClass, idTenant, idBranch });

    const classData = snap.data() || {};
    const fromDate = classData.startDate || new Date();
    const result = await generateSessionsForClass({
      idTenant,
      idBranch,
      idClass,
      classData,
      weeks: 4, // Reduced to 4 weeks to avoid emulator timeout
      fromDate,
    });

    functions.logger.info("generateSessionsOnClassCreate", {
      idTenant,
      idBranch,
      idClass,
      created: result.created,
    });

    return null;
  });
