const admin = require("../functions/node_modules/firebase-admin");

// --- CONFIGURATION ---
const PROD_PROJECT_ID = "pgasistema";
const EMULATOR_HOST = "localhost:8080";
const EMULATOR_AUTH_HOST = "localhost:9099";
const TARGET_EMAIL = "jfelipembf@gmail.com";
const TARGET_TENANT_ID = "rfu0CcAjKx2eonYksTYw";
const TARGET_BRANCH_ID = "QVWiKcua8qCzrx9XzC2p";

// --- INITIALIZATION ---

// 1. Initialize Production App (Read-Only)
// Note: Requires GOOGLE_APPLICATION_CREDENTIALS or accessible default credentials
const prodApp = admin.initializeApp({
    projectId: PROD_PROJECT_ID,
}, "production");

// 2. Initialize Emulator App (Write)
process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = EMULATOR_AUTH_HOST;
const emuApp = admin.initializeApp({
    projectId: PROD_PROJECT_ID,
}, "emulator");

const dbProd = prodApp.firestore();
const dbEmu = emuApp.firestore();
const authEmu = emuApp.auth();

async function run() {
    console.log("🔄 STARTING PROD -> EMULATOR MIRROR...");

    // --- STEP 1: FETCH EMULATOR USER UID ---
    let emuUserUid;
    try {
        const userRecord = await authEmu.getUserByEmail(TARGET_EMAIL);
        emuUserUid = userRecord.uid;
        console.log(`👤 Found Emulator User: ${TARGET_EMAIL} (UID: ${emuUserUid})`);
    } catch (e) {
        console.warn(`⚠️ User ${TARGET_EMAIL} not found. Creating...`);
        try {
            const newUser = await authEmu.createUser({
                email: TARGET_EMAIL,
                password: "password123", // Default password for resumed access
                displayName: "Imported User",
                emailVerified: true
            });
            emuUserUid = newUser.uid;
            console.log(`✅ Created Emulator User: ${TARGET_EMAIL} (UID: ${emuUserUid})`);
        } catch (createErr) {
            console.error(`❌ Failed to create user: ${createErr.message}`);
            process.exit(1);
        }
    }

    // --- STEP 2: MIRROR TENANT ---
    console.log(`\n📥 Fetching Tenant ${TARGET_TENANT_ID} from Prod...`);
    const tenantSnap = await dbProd.collection("tenants").doc(TARGET_TENANT_ID).get();
    if (!tenantSnap.exists) {
        console.error("❌ Tenant not found in Production!");
        return;
    }
    const tenantData = tenantSnap.data();
    await dbEmu.collection("tenants").doc(TARGET_TENANT_ID).set(tenantData);
    console.log(`✅ Mirrored Tenant: ${tenantData.name} (${tenantData.slug})`);

    // Mirror tenant lookup
    await dbEmu.collection("tenantsBySlug").doc(tenantData.slug).set({
        idTenant: TARGET_TENANT_ID,
        slug: tenantData.slug,
        name: tenantData.name
    });
    console.log(`✅ Mirrored Tenant Lookup (tenantsBySlug/${tenantData.slug})`);


    // --- STEP 3: MIRROR BRANCH ---
    console.log(`\n📥 Fetching Branch ${TARGET_BRANCH_ID} from Prod...`);
    const branchSnap = await dbProd.collection("tenants").doc(TARGET_TENANT_ID).collection("branches").doc(TARGET_BRANCH_ID).get();
    if (!branchSnap.exists) {
        console.error("❌ Branch not found in Production!");
        return;
    }
    const branchData = branchSnap.data();
    await dbEmu.collection("tenants").doc(TARGET_TENANT_ID).collection("branches").doc(TARGET_BRANCH_ID).set(branchData);
    console.log(`✅ Mirrored Branch: ${branchData.name} (${branchData.slug})`);


    // --- STEP 4: FIND & MIRROR STAFF RECORD ---
    console.log(`\n🔎 Searching for Staff Record for ${TARGET_EMAIL} in Prod path...`);

    // Query by email in the specific branch's staff collection
    const staffQuery = await dbProd
        .collection("tenants")
        .doc(TARGET_TENANT_ID)
        .collection("branches")
        .doc(TARGET_BRANCH_ID)
        .collection("staff")
        .where("email", "==", TARGET_EMAIL)
        .get();

    if (staffQuery.empty) {
        console.warn(`⚠️ WARNING: No staff record found for ${TARGET_EMAIL} in this branch in Production.`);
        console.warn("   Creating a default Admin staff record instead...");

        const defaultStaff = {
            email: TARGET_EMAIL,
            firstName: "Imported",
            lastName: "User",
            role: "Administrador",
            roleId: "admin",
            active: true,
            createdAt: new Date(),
            origin: "mirror_fallback"
        };

        await dbEmu
            .collection("tenants")
            .doc(TARGET_TENANT_ID)
            .collection("branches")
            .doc(TARGET_BRANCH_ID)
            .collection("staff")
            .doc(emuUserUid) // <--- KEY: Use Emulator UID as Doc ID
            .set(defaultStaff);

        console.log(`✅ Created DEFAULT Admin Staff record mapped to UID ${emuUserUid}`);

    } else {
        const prodStaffDoc = staffQuery.docs[0];
        const prodStaffData = prodStaffDoc.data();
        console.log(`📥 Found Prod Staff Record (UID: ${prodStaffDoc.id}). Role: ${prodStaffData.role}`);

        // Write to Emulator using the EMULATOR'S UID
        await dbEmu
            .collection("tenants")
            .doc(TARGET_TENANT_ID)
            .collection("branches")
            .doc(TARGET_BRANCH_ID)
            .collection("staff")
            .doc(emuUserUid) // <--- KEY: Map Prod Data to Emulator UID
            .set(prodStaffData);

        console.log(`✅ Mirrored Staff Record! mapped to local UID ${emuUserUid}`);
    }

    // Also Copy Role if needed (Optional, prevents errors if role lookup is done)
    if (staffQuery.docs.length > 0 && staffQuery.docs[0].data().roleId) {
        const roleId = staffQuery.docs[0].data().roleId;
        const roleSnap = await dbProd.collection("tenants").doc(TARGET_TENANT_ID).collection("branches").doc(TARGET_BRANCH_ID).collection("roles").doc(roleId).get();
        if (roleSnap.exists) {
            await dbEmu.collection("tenants").doc(TARGET_TENANT_ID).collection("branches").doc(TARGET_BRANCH_ID).collection("roles").doc(roleId).set(roleSnap.data());
            console.log(`✅ Mirrored Role: ${roleId}`);
        }
    }

    console.log("\n🏁 Mirroring Complete!");
}

run().catch(console.error);
