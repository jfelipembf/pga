const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function syncIdsAndPhotos() {
    console.log("🚀 Iniciando sincronização de friendlyId e Fotos em Enrollments e Sessions...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        const clientMap = new Map(); // Global map for all clients: clientId -> { friendlyId, photoUrl }

        // 1. Mapear todos os clientes
        console.log("📦 Mapeando clientes...");
        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                const clientsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clients")
                    .get();

                clientsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    const fid = data.friendlyId || data.idGym || data.gymId;
                    const photo = data.photoUrl || data.photo;
                    clientMap.set(doc.id, {
                        friendlyId: fid || null,
                        photoUrl: photo || null
                    });
                });
            }
        }
        console.log(`✅ ${clientMap.size} clientes mapeados.\n`);

        // 2. Corrigir Enrollments
        console.log("📝 Corrigindo Enrollments...");
        let enrollmentsFixed = 0;
        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                const enrollmentsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("enrollments")
                    .get();

                for (const enrDoc of enrollmentsSnap.docs) {
                    const enr = enrDoc.data();
                    const meta = clientMap.get(enr.idClient);

                    if (!meta) continue;

                    let needsUpdate = false;
                    const updates = {};

                    // Sincronizar ID
                    if (meta.friendlyId && (enr.friendlyId !== meta.friendlyId || enr.idGym !== meta.friendlyId)) {
                        updates.friendlyId = meta.friendlyId;
                        updates.idGym = meta.friendlyId;
                        needsUpdate = true;
                    }

                    // Sincronizar Foto
                    if (meta.photoUrl && enr.clientPhoto !== meta.photoUrl) {
                        updates.clientPhoto = meta.photoUrl;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await enrDoc.ref.update(updates);
                        enrollmentsFixed++;
                    }
                }
            }
        }
        console.log(`✅ ${enrollmentsFixed} matrículas atualizadas.\n`);

        // 3. Corrigir Sessions (Snapshots de Chamada)
        console.log("📅 Corrigindo Snapshots de Chamada em Sessions...");
        let sessionSnapshotsUpdated = 0;
        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                const sessionsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("sessions")
                    .get();

                for (const sessDoc of sessionsSnap.docs) {
                    const sess = sessDoc.data();
                    if (sess.attendanceSnapshot && Array.isArray(sess.attendanceSnapshot)) {
                        let changed = false;
                        const newSnapshot = sess.attendanceSnapshot.map(client => {
                            const clientId = client.idClient || client.id;
                            const meta = clientMap.get(clientId);

                            if (!meta) return client;

                            let itemChanged = false;
                            const updatedClient = { ...client };

                            if (meta.friendlyId && (client.friendlyId !== meta.friendlyId || client.idGym !== meta.friendlyId)) {
                                updatedClient.friendlyId = meta.friendlyId;
                                updatedClient.idGym = meta.friendlyId;
                                itemChanged = true;
                            }

                            if (meta.photoUrl && client.photo !== meta.photoUrl) {
                                updatedClient.photo = meta.photoUrl;
                                itemChanged = true;
                            }

                            if (itemChanged) changed = true;
                            return updatedClient;
                        });

                        if (changed) {
                            await sessDoc.ref.update({ attendanceSnapshot: newSnapshot });
                            sessionSnapshotsUpdated++;
                        }
                    }
                }
            }
        }
        console.log(`✅ ${sessionSnapshotsUpdated} sessões (snapshots) atualizadas.\n`);

        // 4. Corrigir enrolledClients (subcoleção de sessões para experimentais)
        console.log("🧪 Corrigindo Subcoleções de Alunos em Sessões (Experimentais)...");
        let subEnrollmentsFixed = 0;
        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                const sessionsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("sessions")
                    .get();

                for (const sessDoc of sessionsSnap.docs) {
                    const subSnap = await sessDoc.ref.collection("enrolledClients").get();
                    for (const subDoc of subSnap.docs) {
                        const sub = subDoc.data();
                        const meta = clientMap.get(sub.idClient);

                        if (!meta) continue;

                        let needsUpdate = false;
                        const updates = {};

                        if (meta.friendlyId && (sub.friendlyId !== meta.friendlyId || sub.idGym !== meta.friendlyId)) {
                            updates.friendlyId = meta.friendlyId;
                            updates.idGym = meta.friendlyId;
                            needsUpdate = true;
                        }

                        if (meta.photoUrl && sub.clientPhoto !== meta.photoUrl) {
                            updates.clientPhoto = meta.photoUrl;
                            needsUpdate = true;
                        }

                        if (needsUpdate) {
                            await subDoc.ref.update(updates);
                            subEnrollmentsFixed++;
                        }
                    }
                }
            }
        }
        console.log(`✅ ${subEnrollmentsFixed} registros de alunos em sessões atualizados.\n`);

        console.log("🏁 Sincronização finalizada com sucesso!");

    } catch (error) {
        console.error("❌ Erro ao executar script:", error);
    }
}

syncIdsAndPhotos();
