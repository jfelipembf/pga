/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// User CRUD
const userController = require("./controllers/userController");
exports.createUser = userController.createUser;
exports.updateUser = userController.updateUser;
exports.getUser = userController.getUser;
exports.deleteUser = userController.deleteUser;


// Academy Management
const academyController = require("./controllers/academyController");
exports.createAcademy = academyController.createAcademy;
exports.getAcademies = academyController.getAcademies;
exports.checkSlug = academyController.checkSlug;
exports.updateAcademy = academyController.updateAcademy;
exports.diagnosticList = academyController.diagnosticList;

// // Stripe Integration
// const stripeController = require("./controllers/stripeController");
// exports.createCheckoutSession = stripeController.createCheckoutSession;
// exports.handleStripeWebhook = stripeController.handleStripeWebhook;
// exports.getSubscriptionPlan = stripeController.getSubscriptionPlan;
// exports.getSubscriptionPlans = stripeController.getSubscriptionPlans;
// exports.listSubscriptionPlans = stripeController.listSubscriptionPlans;
// exports.getStripeInvoices = stripeController.getStripeInvoices;

