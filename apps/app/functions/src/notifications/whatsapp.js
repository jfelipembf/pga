const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");
const { getIntegrationConfigInternal } = require("../shared/integrations");



if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Sends a WhatsApp message using Evolution API.
 * @param {object} data - { idTenant, idBranch, idClient, message, phoneOverride }
 */
/**
 * Internal function to send WhatsApp message.
 * Can be reused by other Cloud Functions.
 */
const sendWhatsAppMessageInternal = async (idTenant, idBranch, phone, message, integrationId = "evolution") => {
    // 1. Get Integration Config
    const config = await getIntegrationConfigInternal(idTenant, idBranch, integrationId);

    if (!config || !config.baseUrl || !config.apiKey) {
        console.error("Evolution API not configured.");
        throw new functions.https.HttpsError("failed-precondition", "Evolution API is not fully configured.");
    }

    if (!phone) {
        throw new functions.https.HttpsError("invalid-argument", "No phone number provided");
    }

    // Format phone: remove non-numeric chars
    let formattedPhone = phone.replace(/\D/g, "");

    // Brazilian Phone Check & WhatsApp ID Formatting
    // Brazilian numbers have 10 (fixed) or 11 (mobile) digits.
    // However, WhatsApp IDs (JID) for many Brazilian regions (DDD >= 31)
    // often DO NOT include the 9th digit, even if the phone number does.
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
        if (formattedPhone.length === 11) {
            const ddd = parseInt(formattedPhone.substring(0, 2), 10);
            const ninthDigit = formattedPhone.charAt(2);

            // DDDs 11-28 follow the 9-digit rule on WhatsApp.
            // DDDs >= 31 usually use 8 digits in the JID.
            if (ddd >= 31 && ninthDigit === "9") {
                console.log(`WhatsAppService: Removendo o nono dígito para DDD ${ddd} (JID optimization)`);
                formattedPhone = formattedPhone.substring(0, 2) + formattedPhone.substring(3);
            }
        }
        formattedPhone = "55" + formattedPhone;
    }

    // 2. Send Message via Evolution API
    const instanceName = config.instanceName || "default";

    // Remove trailing slash from baseUrl if present
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/message/sendText/${instanceName}`;

    const payload = {
        number: formattedPhone,
        text: message,
        options: {
            delay: 1200,
            presence: "composing",
        }
    };

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    apikey: config.apiKey,
                    "Content-Type": "application/json",
                },
                timeout: 10000 // 10s timeout
            });

            return { success: true, data: response.data };

        } catch (error) {
            attempt++;
            const isDnsError = error.code === 'EAI_AGAIN' || error.message?.includes('EAI_AGAIN');

            if (isDnsError && attempt < maxRetries) {
                console.warn(`WhatsAppService: Retry ${attempt}/${maxRetries} due to DNS error.`);
                await new Promise(res => setTimeout(res, 2000));
            } else if (attempt < maxRetries && error.response && error.response.status >= 500) {
                console.warn(`WhatsAppService: Retry ${attempt}/${maxRetries} due to 5xx error.`);
                await new Promise(res => setTimeout(res, 2000));
            } else {
                if (!isDnsError && (!error.response || error.response.status < 500)) {
                    throw error;
                }
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }

    throw new Error("Failed to send WhatsApp message after multiple retries");
};

exports.sendWhatsAppMessageInternal = sendWhatsAppMessageInternal;

exports.sendWhatsAppMessage = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {



        if (!context.auth) {
            console.warn("User not authenticated.");
            throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
        }

        const { idTenant, idBranch, idClient, message, phoneOverride } = data;

        if (!idTenant || !idBranch || !message) {
            console.error("Missing required fields:", { idTenant, idBranch, message });
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
        }

        try {
            let phone = phoneOverride;

            // Fetch Client Phone if not overridden
            if (!phone && idClient) {
                const clientRef = db
                    .collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clients")
                    .doc(idClient);

                const clientSnap = await clientRef.get();
                if (!clientSnap.exists) {
                    throw new functions.https.HttpsError("not-found", "Client not found");
                }
                const clientData = clientSnap.data();
                phone = clientData.phone || clientData.mobile || clientData.whatsapp;
            }

            if (!phone) {
                throw new functions.https.HttpsError("invalid-argument", "No phone number found for client");
            }

            return await sendWhatsAppMessageInternal(idTenant, idBranch, phone, message);

        } catch (error) {
            console.error("Error sending WhatsApp message:", error.message);

            if (error.response) {
                console.error("Evolution API Error:", error.response.data);
                throw new functions.https.HttpsError("unknown", `Evolution API Error: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                throw new functions.https.HttpsError("unavailable", "Evolution API unreachable.");
            }

            throw new functions.https.HttpsError("internal", error.message);
        }
    });
