const admin = require("../functions/node_modules/firebase-admin");

// Initialize pointing to EMULATOR
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"; // Fix: Point Auth to Emulator
process.env.GCLOUD_PROJECT = "pgasistema";

admin.initializeApp({
    projectId: "pgasistema"
});

const db = admin.firestore();

const seedData = async () => {
    console.log("🌱 Seeding Emulator...");

    // 1. Tenant "a2"
    const tenantId = "rfu0CcAjKx2eonYksTYw";
    const tenantData = {
        name: "a2",
        slug: "a2",
        businessName: "A2 Academia",
        cnpj: "10606528000162",
        status: "trial",
        subscriptionStatus: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Add minimal address if needed
        address: {
            cep: "49000215",
            cidade: "Aracaju",
            estado: "SE",
            bairro: "Aruana",
            numero: "418"
        }
    };

    await db.collection("tenants").doc(tenantId).set(tenantData);
    console.log(`✅ Tenant 'a2' (${tenantId}) created.`);

    // 2. Branch "unidade-1"
    const branchId = "QVWiKcua8qCzrx9XzC2p";
    const branchData = {
        name: "Unidade 1",
        slug: "unidade-1",
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("tenants").doc(tenantId).collection("branches").doc(branchId).set(branchData);
    console.log(`✅ Branch 'unidade-1' (${branchId}) created.`);

    // 3. TenantsBySlug (Required for Login lookup)
    await db.collection("tenantsBySlug").doc("a2").set({
        idTenant: tenantId,
        slug: "a2",
        name: "a2"
    });
    console.log(`✅ Tenant Lookup 'tenantsBySlug/a2' created.`);

    // 4. Create Auth User (Admin)
    const adminEmail = "admin@a2.com";
    const adminPassword = "123456"; // Emulators only

    let userRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(adminEmail);
        console.log(`ℹ️ User ${adminEmail} already exists (UID: ${userRecord.uid})`);
    } catch (e) {
        userRecord = await admin.auth().createUser({
            email: adminEmail,
            password: adminPassword,
            displayName: "Admin A2",
            emailVerified: true
        });
        console.log(`✅ Created Auth User: ${adminEmail} (UID: ${userRecord.uid})`);
    }

    // 5. Create Staff Entry (Required for Access)
    const staffData = {
        email: adminEmail,
        firstName: "Admin",
        lastName: "Local",
        role: "Administrador",
        roleId: "admin", // simple role
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db
        .collection("tenants")
        .doc(tenantId)
        .collection("branches")
        .doc(branchId)
        .collection("staff")
        .doc(userRecord.uid)
        .set(staffData);

    console.log(`✅ Staff member created for ${adminEmail} in branch ${branchId}`);

    // 6. Setup User-Created Account (jfelipembf@gmail.com)
    const userEmail = "jfelipembf@gmail.com";
    try {
        const userRecord = await admin.auth().getUserByEmail(userEmail);
        console.log(`ℹ️ Found manually created user: ${userEmail} (UID: ${userRecord.uid})`);

        await db
            .collection("tenants")
            .doc(tenantId)
            .collection("branches")
            .doc(branchId)
            .collection("staff")
            .doc(userRecord.uid)
            .set({
                email: userEmail,
                firstName: "Felipe",
                lastName: "Macedo",
                role: "Administrador",
                roleId: "admin",
                active: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        console.log(`✅ Staff permissions granted to ${userEmail}`);
    } catch (e) {
        console.log(`⚠️ User ${userEmail} not found in Auth. Skipping...`);
    }

    console.log("🏁 Seeding complete!");
    console.log(`\n🔑 LOGIN CREDENTIALS:\n1. Admin: admin@a2.com / 123456\n2. Felipe: jfelipembf@gmail.com / (Sua senha)`);
};

seedData().catch(console.error);
