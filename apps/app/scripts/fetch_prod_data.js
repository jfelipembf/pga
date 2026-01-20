const admin = require("firebase-admin");
const fs = require("fs");

admin.initializeApp({
    projectId: "pgasistema"
});

const db = admin.firestore();

async function run() {
    console.log("Fetching tenants...");
    const tenantsSnap = await db.collection("tenants").get();

    let targetTenant = null;
    let targetBranch = null;

    for (const doc of tenantsSnap.docs) {
        const data = doc.data();
        console.log(`Found tenant: ${doc.id} (slug: ${data.slug})`);

        // Check for "as" (exact) or "a2" (potential typo)
        if (data.slug === "as" || data.slug === "a2") {
            targetTenant = { id: doc.id, ...data };
            console.log(`>>> MATCHED TENANT: ${data.slug}`);

            // Find branch
            const branchesSnap = await db.collection(`tenants/${doc.id}/branches`).get();
            for (const bDoc of branchesSnap.docs) {
                const bData = bDoc.data();
                console.log(`   Found branch: ${bDoc.id} (slug: ${bData.slug})`);

                if (bData.slug === "unidade-1") {
                    targetBranch = { id: bDoc.id, ...bData };
                    console.log(`   >>> MATCHED BRANCH: ${bData.slug}`);
                }
            }
        }
    }

    if (targetTenant && targetBranch) {
        const seedData = {
            tenant: targetTenant,
            branch: targetBranch
        };
        fs.writeFileSync("seed_data.json", JSON.stringify(seedData, null, 2));
        console.log("SUCCESS: Saved seed_data.json");
    } else {
        console.log("ERROR: Could not find matching tenant/branch combination.");
    }
}

run().catch(console.error);
