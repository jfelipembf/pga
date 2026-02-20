const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function migrateContracts() {
    console.log("Iniciando migração de ClientContracts para o novo schema...");

    const tenantsSnapshot = await db.collection('tenants').get();

    let totalMigrated = 0;

    for (const tenantDoc of tenantsSnapshot.docs) {
        const idTenant = tenantDoc.id;
        console.log(`\nProcessando Tenant: ${idTenant}`);

        const branchesSnapshot = await db.collection(`tenants/${idTenant}/branches`).get();

        for (const branchDoc of branchesSnapshot.docs) {
            const idBranch = branchDoc.id;
            console.log(`  Processando Branch: ${idBranch}`);

            const contractsRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/clientContracts`);
            const contractsSnapshot = await contractsRef.get();

            let batch = db.batch();
            let batchCount = 0;

            for (const contractDoc of contractsSnapshot.docs) {
                const data = contractDoc.data();

                // Pular os que já foram migrados
                if (data.cancellation !== undefined && data.suspension !== undefined && data.idClientContract !== undefined) {
                    continue;
                }

                const updates = {};

                // 1. Migrar friendlyId para idClientContract
                if (data.friendlyId) {
                    updates.idClientContract = data.friendlyId;
                    updates.friendlyId = admin.firestore.FieldValue.delete();
                }

                // 2. Migrar idContractTemplate / idPlan para idContract
                if (data.idContractTemplate || data.idPlan) {
                    updates.idContract = data.idPlan || data.idContractTemplate;
                    if (data.idContractTemplate) updates.idContractTemplate = admin.firestore.FieldValue.delete();
                    if (data.idPlan) updates.idPlan = admin.firestore.FieldValue.delete();
                }

                // 3. Adicionar objeto cancellation
                updates.cancellation = {
                    canceledAt: data.canceledAt || null,
                    canceledBy: data.canceledBy || null,
                    effectiveDate: data.effectiveDate || null,
                    feeApplied: data.cancellationFee || 0,
                    futureReceivablesCanceled: data.futureReceivablesCanceled || false,
                    reason: data.cancellationReason || null
                };

                // Limpar campos antigos de cancelamento soltos
                if (data.canceledAt !== undefined) updates.canceledAt = admin.firestore.FieldValue.delete();
                if (data.canceledBy !== undefined) updates.canceledBy = admin.firestore.FieldValue.delete();
                if (data.effectiveDate !== undefined) updates.effectiveDate = admin.firestore.FieldValue.delete();
                if (data.cancellationFee !== undefined) updates.cancellationFee = admin.firestore.FieldValue.delete();
                if (data.futureReceivablesCanceled !== undefined) updates.futureReceivablesCanceled = admin.firestore.FieldValue.delete();
                if (data.cancellationReason !== undefined) updates.cancellationReason = admin.firestore.FieldValue.delete();

                // 4. Adicionar objeto suspension
                updates.suspension = {
                    current: data.currentSuspension || null,
                    history: data.suspensionHistory || [],
                    isSuspended: data.status === 'suspended',
                    totalDaysUsed: data.totalSuspendedDays || 0
                };

                // Limpar campos antigos de suspensão soltos
                if (data.currentSuspension !== undefined) updates.currentSuspension = admin.firestore.FieldValue.delete();
                if (data.suspensionHistory !== undefined) updates.suspensionHistory = admin.firestore.FieldValue.delete();
                if (data.totalSuspendedDays !== undefined) updates.totalSuspendedDays = admin.firestore.FieldValue.delete();

                batch.update(contractDoc.ref, updates);
                batchCount++;
                totalMigrated++;

                // Commit em lotes de 500
                if (batchCount >= 500) {
                    await batch.commit();
                    console.log(`    Completados 500 contratos...`);
                    batch = db.batch();
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                await batch.commit();
                console.log(`    Completados ${batchCount} contratos.`);
            }
        }
    }

    console.log(`\nMigração concluída com sucesso! Total atualizados: ${totalMigrated}`);
}

migrateContracts().catch(console.error);
