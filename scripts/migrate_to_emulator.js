const admin = require("firebase-admin");

// Initialize Production App
const prodApp = admin.initializeApp({
    projectId: "pgasistema"
}, "production");

// Initialize Emulator App (configured via env variables)
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
const emuApp = admin.initializeApp({
    projectId: "pgasistema"
}, "emulator");

const prodFs = prodApp.firestore();
const emuFs = emuApp.firestore();

async function migrateCollection(collectionPath, isSubcollection = false) {
    console.log(`Migrating collection: ${collectionPath}`);
    const snapshot = await prodFs.collection(collectionPath).get();

    console.log(`Found ${snapshot.size} documents in ${collectionPath}`);

    for (const doc of snapshot.docs) {
        const data = doc.data();
        await emuFs.doc(`${collectionPath}/${doc.id}`).set(data);

        // If it's a tenant, migrate branches
        if (collectionPath === 'tenants') {
            await migrateCollection(`tenants/${doc.id}/branches`, true);
        }

        // If it's a branch, you might want to migrate its subcollections
        if (isSubcollection && collectionPath.includes('/branches')) {
            const subColls = ['clients', 'sales', 'staff', 'classes', 'products', 'contracts'];
            for (const sub of subColls) {
                await migrateCollection(`${collectionPath}/${doc.id}/${sub}`, true);
            }
        }
    }
}

async function run() {
    try {
        const collections = ['tenants', 'tenantsBySlug', 'users', 'counters'];
        for (const coll of collections) {
            await migrateCollection(coll);
        }
        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

run();
