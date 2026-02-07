const admin = require("firebase-admin");

let serviceAccount;
try {
    // Try to load service account key if present
    serviceAccount = require("../../firebase-adminsdk-private-key.json");
} catch (e) {
    // Ignore error if file not found
}

try {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        console.log("No service account key found, using Application Default Credentials...");
        admin.initializeApp();
    }
} catch (initError) {
    console.error("Failed to initialize Firebase Admin:", initError);
    process.exit(1);
}

const db = admin.firestore();

async function checkIndex() {
    console.log("Checking index for: collectionGroup('cashierSessions').where('status', '==', 'open')");
    try {
        const snapshot = await db.collectionGroup("cashierSessions")
            .where("status", "==", "open")
            .limit(1)
            .get();

        console.log("Query succeeded! Found " + snapshot.size + " documents.");
        console.log("Index already exists or is not required.");
    } catch (error) {
        if (error.code === 9 || error.message.includes("FAILED_PRECONDITION")) {
            console.log("\n--- INDEX MISSING DETECTED ---\n");
            // The error message usually contains the URL to create it.
            console.log(error.message);

            const match = error.message.match(/(https:\/\/console\.firebase\.google\.com\/.*)/);
            if (match) {
                console.log("\nCopy and paste this URL to create the index:");
                console.log(match[0]);
            } else {
                console.log("\nCould not find direct URL in the error message. Please check the full error above.");
            }
        } else {
            console.error("An unexpected error occurred:", error);
        }
    }
}

checkIndex();
