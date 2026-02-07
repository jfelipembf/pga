const admin = require("firebase-admin");

let serviceAccount;
try {
    serviceAccount = require("../../firebase-adminsdk-private-key.json");
} catch (e) {
    // Ignore error
}

try {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // If running locally with `gcloud auth application-default login`, this works
        console.log("No service key file, trying default credentials...");
        admin.initializeApp();
    }
} catch (initError) {
    // If already initialized
}

const db = admin.firestore();

async function simulateAutoClose() {
    console.log("=== SIMULATION STARTED ===");
    try {
        console.log("Attempting Collection Group Query...");

        // 1. Try the optimized (Index-dependent) method first to debug the error
        const openSessionsSnap = await db.collectionGroup("cashierSessions")
            .where("status", "==", "open")
            .get();

        if (openSessionsSnap.empty) {
            console.log("Query success! No open sessions found.");
        } else {
            console.log(`Query success! Found ${openSessionsSnap.size} open sessions.`);
            openSessionsSnap.forEach(doc => {
                console.log(` - Would close session: ${doc.id} at ${doc.ref.path}`);
            });
        }

    } catch (error) {
        console.error("\n[ERROR] Collection Group Query Failed:");
        console.error(error.message);

        if (error.code === 9 || error.message.includes("FAILED_PRECONDITION")) {
            console.log("\n--- DIAGNOSIS: INDEX ISSUE ---");
            console.log("The index for 'cashierSessions' (Collection Group Scope) on field 'status' is missing or not ready.");
            console.log("Please check Firebase Console -> Firestore -> Indexes -> Single Field.");
            console.log("Ensure 'cashierSessions' has an exemption with Collection Group scope enabled.");
        }

        // 2. Fallback execution simulation (Robust method)
        console.log("\n=== FALLBACK STRATEGY SIMULATION ===");
        console.log("Simulating robust method without Collection Group Index...");

        const tenantsSnap = await db.collection("tenants").get();
        console.log(`Found ${tenantsSnap.size} tenants.`);

        let totalOpen = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const branchesSnap = await tenantDoc.ref.collection("branches").get();
            // console.log(`Tenant ${tenantDoc.id}: ${branchesSnap.size} branches.`);

            for (const branchDoc of branchesSnap.docs) {
                const sessionsSnap = await branchDoc.ref.collection("cashierSessions")
                    .where("status", "==", "open")
                    .get();

                if (!sessionsSnap.empty) {
                    console.log(` -> Branch ${branchDoc.id}: Found ${sessionsSnap.size} open sessions.`);
                    totalOpen += sessionsSnap.size;
                }
            }
        }
        console.log(`Total open sessions found via Fallback method: ${totalOpen}`);
    }
    console.log("=== SIMULATION ENDED ===");
}

simulateAutoClose();
