
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function findActiveTenant() {
    const tenants = await db.collection('tenants').limit(10).get();
    for (const doc of tenants.docs) {
        const idTenant = doc.id;
        const branches = await db.collection('tenants').doc(idTenant).collection('branches').get();
        for (const branchDoc of branches.docs) {
            const idBranch = branchDoc.id;
            const trials = await db.collection('tenants').doc(idTenant).collection('branches').doc(idBranch).collection('enrollments')
                .where('enrollmentType', '==', 'trial')
                .limit(5)
                .get();

            if (!trials.empty) {
                console.log(`Found trials for tenant: ${idTenant}, branch: ${idBranch}`);
                trials.docs.forEach(t => {
                    console.log(`Trial: ${JSON.stringify(t.data(), null, 2)}`);
                });
                return;
            }
        }
    }
    console.log('No trials found in the first 10 tenants.');
}

findActiveTenant().catch(console.error);
