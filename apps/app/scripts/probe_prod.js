const admin = require("../functions/node_modules/firebase-admin");

// Initialize Production App
// Assumes valid GOOGLE_APPLICATION_CREDENTIALS or gcloud auth
const app = admin.initializeApp({
    projectId: "pgasistema"
});

const db = app.firestore();

async function listTenants() {
    console.log("🔍 Listing tenants in 'pgasistema'...");
    try {
        const snapshot = await db.collection("tenants").get();
        if (snapshot.empty) {
            console.log("⚠️ No tenants found.");
            return;
        }

        console.log(`✅ Found ${snapshot.size} tenants:`);
        snapshot.forEach(doc => {
            console.log(`- ID: ${doc.id} | Name: ${doc.data().name || doc.data().businessName} | Slug: ${doc.data().slug}`);
        });

    } catch (error) {
        console.error("❌ Error accessing production:", error.message);
        if (error.code === 7) {
            console.error("💡 Hint: Permission denied. You might need to run 'gcloud auth application-default login'.");
        }
    }
}

listTenants();
