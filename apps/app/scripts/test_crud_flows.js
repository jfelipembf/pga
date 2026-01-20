// scripts/test_crud_flows.js
// Run with: node scripts/test_crud_flows.js

const { initializeApp } = require("firebase/app");
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require("firebase/functions");
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, connectFirestoreEmulator, doc, getDoc } = require("firebase/firestore");

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "fake-api-key", // Emulator doesn't check this
    projectId: "pgasistema",
    authDomain: "pgasistema.firebaseapp.com",
};

// --- INIT ---
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to Emulators
connectFunctionsEmulator(functions, "localhost", 5001);
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);

// --- HELPERS ---
const getIdTenant = () => "rfu0CcAjKx2eonYksTYw"; // A2
const getIdBranch = () => "QVWiKcua8qCzrx9XzC2p"; // Unidade 1

// REMOVED: Public client registration feature has been removed
/*
async function testPublicRegister() {
    console.log("\n🧪 TESTING: Public Self-Register (createPublicClient)...");

    const createPublicClient = httpsCallable(functions, "createPublicClient");

    const payload = {
        idTenant: getIdTenant(),
        idBranch: getIdBranch(),
        clientData: {
            name: "Test Public User",
            email: `public_test_${Date.now()}@test.com`,
            cpf: "111.111.111-11",
            phone: "11999999999",
            birthDate: "1990-01-01",
            gender: "feminino" // Testing lowercase
        }
    };

    try {
        const result = await createPublicClient(payload);
        console.log("✅ Success! Response:", result.data);

        // Verify Data in Firestore
        const clientRef = doc(db, "tenants", getIdTenant(), "branches", getIdBranch(), "clients", result.data.id);
        const snap = await getDoc(clientRef);

        if (snap.exists()) {
            const data = snap.data();
            console.log("   📝 Database Record:", {
                idGym: data.idGym,
                name: data.name,
                gender: data.gender,
                origin: data.origin
            });

            if (data.gender === "feminino") console.log("   ✅ Gender Correct (feminino)");
            else console.error("   ❌ Gender Incorrect:", data.gender);

            if (data.origin === "self_register") console.log("   ✅ Origin Correct (self_register)");
        } else {
            console.error("   ❌ Document not found in Firestore!");
        }

    } catch (e) {
        console.error("❌ Failed:", e.message);
    }
}
*/

async function testAdminRegister() {
    console.log("\n🧪 TESTING: Admin Register (createClient)...");

    // 1. Logic
    console.log("   🔐 Logging in as Admin...");
    try {
        await signInWithEmailAndPassword(auth, "admin@a2.com", "123456");
        console.log("   ✅ Logged in.");
    } catch (e) {
        console.error("   ❌ Login failed:", e.code, e.message);
        return;
    }

    const createClient = httpsCallable(functions, "createClient");

    const payload = {
        idTenant: getIdTenant(),
        idBranch: getIdBranch(),
        clientData: {
            name: "Test Admin User",
            email: `admin_test_${Date.now()}@test.com`,
            cpf: "222.222.222-22",
            phone: "11888888888",
            birthDate: "1985-05-05",
            gender: "masculino",
            active: true
        }
    };

    try {
        const result = await createClient(payload);
        console.log("✅ Success! Response:", result.data);

        // Verify Data in Firestore
        const clientRef = doc(db, "tenants", getIdTenant(), "branches", getIdBranch(), "clients", result.data.id);
        const snap = await getDoc(clientRef);

        if (snap.exists()) {
            const data = snap.data();
            console.log("   📝 Database Record:", {
                idGym: data.idGym,
                name: data.name,
                gender: data.gender,
                origin: data.origin
            });

            if (data.gender === "masculino") console.log("   ✅ Gender Correct (masculino)");
            else console.error("   ❌ Gender Incorrect:", data.gender);

        } else {
            console.error("   ❌ Document not found in Firestore!");
        }

    } catch (e) {
        console.error("❌ Failed:", e.message);
    }
}

async function run() {
    // await testPublicRegister(); // REMOVED: Feature disabled
    await testAdminRegister();
    console.log("\n🏁 Tests Finished. Press Ctrl+C to exit if it hangs (Firebase sockets vary).");
    process.exit(0);
}

run();
