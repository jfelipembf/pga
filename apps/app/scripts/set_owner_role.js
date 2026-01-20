const admin = require("../functions/node_modules/firebase-admin");

// Configure to query the emulator
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.GCLOUD_PROJECT = "pgasistema";

admin.initializeApp({
    projectId: "pgasistema"
});

const db = admin.firestore();
const auth = admin.auth();

const TARGET_EMAIL = "jfelipembf@gmail.com";
const TENANT_ID = "rfu0CcAjKx2eonYksTYw";
const BRANCH_ID = "QVWiKcua8qCzrx9XzC2p";

async function setOwner() {
    console.log(`🔍 Checking configuration for ${TARGET_EMAIL}...`);

    try {
        // 1. Check Authentication
        const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
        console.log(`✅ Auth User found: UID ${userRecord.uid}`);

        // 2. Update Firestore Role
        const staffRef = db
            .collection("tenants")
            .doc(TENANT_ID)
            .collection("branches")
            .doc(BRANCH_ID)
            .collection("staff")
            .doc(userRecord.uid);

        const docSnap = await staffRef.get();

        if (!docSnap.exists) {
            console.log("⚠️ Staff document not found. Creating new one...");
            await staffRef.set({
                email: TARGET_EMAIL,
                firstName: "Felipe",
                lastName: "Macedo",
                role: "Owner",    // Display name
                roleId: "owner",  // System ID
                active: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            console.log(`ℹ️ Current Role: ${docSnap.data().role} (${docSnap.data().roleId})`);
            console.log("🔄 Updating to Owner...");

            await staffRef.update({
                role: "Owner",
                roleId: "owner"
            });
        }

        console.log("✅ User updated to OWNER successfully.");

    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            console.error("❌ User not found in Authentication. Please create the user first.");
        } else {
            console.error("❌ Error:", e);
        }
    }
}

setOwner();
