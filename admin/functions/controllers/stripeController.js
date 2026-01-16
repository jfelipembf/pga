const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { db } = require("../helpers/firebaseAdmin");
const stripeService = require("../services/stripeService");
const logger = require("firebase-functions/logger");
const { defineSecret } = require("firebase-functions/params");

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

/**
 * Callable function to create a checkout session.
 */
exports.createCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
    const { tenantId, priceId } = request.data;
    const auth = request.auth;

    if (!auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    if (!tenantId || !priceId) {
        throw new HttpsError("invalid-argument", "Missing tenantId or priceId.");
    }

    try {
        // Fetch tenant data for email and validation
        const tenantDoc = await db.collection("tenants").doc(tenantId).get();
        if (!tenantDoc.exists) {
            throw new HttpsError("not-found", "Tenant not found.");
        }

        const tenantData = tenantDoc.data();
        const customerEmail = tenantData.email;

        const baseUrl = process.env.BASE_URL || "https://app.painelswim.com";
        const successUrl = `${baseUrl}/academies?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/academies`;

        const session = await stripeService.createCheckoutSession({
            tenantId,
            customerEmail,
            priceId,
            successUrl,
            cancelUrl,
            secretKey: stripeSecretKey.value()
        });

        return { url: session.url };
    } catch (error) {
        logger.error("Error in createCheckoutSession:", error);
        throw new HttpsError("internal", error.message);
    }
});

/**
 * Webhook handler for Stripe events.
 */
exports.handleStripeWebhook = onRequest({ secrets: [stripeWebhookSecret, stripeSecretKey] }, async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = stripeWebhookSecret.value();

    let event;

    try {
        event = stripeService.constructEvent(req.rawBody, sig, endpointSecret, stripeSecretKey.value());
    } catch (err) {
        logger.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const session = event.data.object;
    let tenantId = session.client_reference_id || session.metadata?.tenantId;

    // Fallback: If tenantId is not in metadata, check the Customer object in Stripe
    if (!tenantId && session.customer) {
        try {
            const stripe = stripeService.getStripe(stripeSecretKey.value());
            const customer = await stripe.customers.retrieve(session.customer);
            tenantId = customer.metadata?.tenantId;
        } catch (err) {
            logger.warn("Could not retrieve customer from Stripe to find tenantId:", err.message);
        }
    }

    if (!tenantId) {
        logger.warn("Received Stripe event without tenantId metadata:", event.type);
        return res.status(200).send("Event received but no tenantId found.");
    }

    try {
        const tenantRef = db.collection("tenants").doc(tenantId);

        switch (event.type) {
            case 'checkout.session.completed':
            case 'invoice.paid':
                await tenantRef.update({
                    subscriptionStatus: 'active',
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription || null,
                    updatedAt: new Date()
                });
                logger.info(`Subscription activated for tenant: ${tenantId}`);
                break;

            case 'invoice.payment_failed':
            case 'customer.subscription.deleted':
                await tenantRef.update({
                    subscriptionStatus: 'past_due', // or 'canceled'
                    updatedAt: new Date()
                });
                logger.warn(`Subscription payment failed or deleted for tenant: ${tenantId}`);
                break;

            default:
                logger.debug(`Unhandled event type: ${event.type}`);
        }

        res.status(200).send("Event processed.");
    } catch (error) {
        logger.error("Error processing Stripe webhook event:", error);
        res.status(500).send("Internal Server Error");
    }
});

/**
 * Fetch plan details.
 */
exports.getSubscriptionPlan = onCall({ secrets: [stripeSecretKey] }, async (request) => {
    const { priceId } = request.data;
    if (!priceId) {
        throw new HttpsError("invalid-argument", "Missing priceId.");
    }
    try {
        return await stripeService.getPriceDetails(priceId, stripeSecretKey.value());
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});
/**
 * Fetch multiple subscription plans details.
 */
exports.getSubscriptionPlans = onCall({ secrets: [stripeSecretKey] }, async (request) => {
    const { priceIds } = request.data;
    if (!priceIds || !Array.isArray(priceIds)) {
        throw new HttpsError("invalid-argument", "Missing or invalid priceIds array.");
    }
    try {
        return await stripeService.getPricesDetails(priceIds, stripeSecretKey.value());
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});

/**
 * List all active subscription plans.
 */
exports.listSubscriptionPlans = onCall({ secrets: [stripeSecretKey] }, async (request) => {
    try {
        return await stripeService.listActivePrices(stripeSecretKey.value());
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});

/**
 * Fetch invoices for a customer.
 */
exports.getStripeInvoices = onCall({ secrets: [stripeSecretKey] }, async (request) => {
    const { customerId } = request.data;
    const auth = request.auth;

    if (!auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    if (!customerId) {
        throw new HttpsError("invalid-argument", "Missing customerId.");
    }

    try {
        return await stripeService.getInvoices(customerId, stripeSecretKey.value());
    } catch (error) {
        logger.error("Error in getStripeInvoices:", error);
        throw new HttpsError("internal", error.message);
    }
});
