/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const admin = require("firebase-admin");
admin.initializeApp();

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

const { updateUserPassword } = require("./updateUserPassword");

exports.updateUserPassword = updateUserPassword;
exports.autoCloseCashier = require("./triggers/autoCloseCashier");
exports.processDashboardSnapshot = require("./triggers/processDashboardSnapshot");
exports.ensureSessionsHorizon = require("./triggers/ensureSessionsHorizon");
exports.processScheduledSuspensions = require("./triggers/processScheduledSuspensions");
exports.processSuspensionEnds = require("./triggers/processSuspensionEnds");
exports.processScheduledCancellations = require("./triggers/processScheduledCancellations");
exports.processContractDefaultCancellation = require("./triggers/processContractDefaultCancellation");
exports.checkExperimentalClassAutomations = require("./triggers/checkExperimentalClassAutomations");
exports.checkBirthdayAutomations = require("./triggers/checkBirthdayAutomations");
exports.autoSettleReceivables = require("./triggers/autoSettleReceivables");
