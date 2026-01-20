// scripts/test_staff_creation.js
const { initializeApp } = require("firebase/app");
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require("firebase/functions");
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require("firebase/auth");

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "fake-api-key",
    projectId: "pgasistema",
    authDomain: "pgasistema.firebaseapp.com",
};

// --- INIT ---
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");
const auth = getAuth(app);

// Connect to Emulators
connectFunctionsEmulator(functions, "localhost", 5001);
connectAuthEmulator(auth, "http://localhost:9099");

const ID_TENANT = "rfu0CcAjKx2eonYksTYw";
const ID_BRANCH = "QVWiKcua8qCzrx9XzC2p";

async function run() {
    console.log("\n🧪 TESTING: Staff Creation (staffCriarUsuario)...");

    // 1. Login as Admin
    console.log("   🔐 Logging in as Admin (admin@a2.com)...");
    try {
        await signInWithEmailAndPassword(auth, "admin@a2.com", "123456");
        console.log("   ✅ Logged in.");
    } catch (e) {
        console.error("   ❌ Login failed:", e.message);
        return;
    }

    // 2. Prepare Data
    const createStaff = httpsCallable(functions, "staffCriarUsuario");
    const payload = {
        idTenant: ID_TENANT,
        idBranch: ID_BRANCH,
        firstName: "Staff",
        lastName: "Test",
        email: `staff_test_${Date.now()}@test.com`,
        status: "active",
        role: "Instrutor",
        roleId: "instructor" // assuming this role exists or logic handles it
    };

    // 3. Call Function
    try {
        console.log("   📞 Calling staffCriarUsuario...");
        const result = await createStaff(payload);
        console.log("   ✅ Success! UID:", result.data.uid);
    } catch (e) {
        console.error("\n   ❌ FAILED to create staff:");
        console.error("   Code:", e.code);
        console.error("   Message:", e.message);
        if (e.details) console.error("   Details:", JSON.stringify(e.details, null, 2));
    }
}

run();
