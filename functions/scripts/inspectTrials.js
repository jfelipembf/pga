
const { getFirestore, collection, query, where, getDocs } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function inspectTrials() {
    const idTenant = 'D6m6idLid0OqLOfzE56m'; // Example tenant from logs or common one
    const idBranch = 'default'; // Common branch

    console.log(`Inspecting trials for tenant: ${idTenant}, branch: ${idBranch}`);

    const colPath = `tenants/${idTenant}/branches/${idBranch}/enrollments`;
    const q = db.collection(colPath).where('enrollmentType', '==', 'trial');

    const snapshot = await q.get();

    if (snapshot.empty) {
        console.log('No trials found in the entire branch.');
        return;
    }

    console.log(`Found ${snapshot.size} trials.`);
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- Trial ID: ${doc.id}`);
        console.log(`  Client: ${data.clientName} (${data.idClient})`);
        console.log(`  Date: ${data.startDate}`);
        console.log(`  Activity: ${data.activityName} (${data.idActivity})`);
        console.log(`  Staff: ${data.instructorName} (${data.idStaff})`);
        console.log(`  Class ID: ${data.idClass}`);
        console.log('---');
    });
}

inspectTrials().catch(console.error);
