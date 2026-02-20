const admin = require('firebase-admin');

/**
 * Recalcula e sincroniza os campos 'computed' de um cliente.
 * Pode ser usado dentro de uma transação do Firestore.
 * 
 * @param {admin.firestore.Transaction} transaction - A transação ativa.
 * @param {string} idTenant - ID do Tenant.
 * @param {string} idBranch - ID da Unidade.
 * @param {string} idClient - ID do Cliente.
 */
async function syncClientComputedFields(transaction, idTenant, idBranch, idClient) {
    if (!idClient) return;

    const db = admin.firestore();
    const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
    const contractsRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/clientContracts`);
    const enrollmentsRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/enrollments`);

    // 1. Buscar Contrato Ativo
    const contractsSnapshot = await transaction.get(
        contractsRef
            .where('idClient', '==', idClient)
            .where('status', '==', 'active')
            .limit(1)
    );

    const activeContract = contractsSnapshot.empty ? null : contractsSnapshot.docs[0].data();

    // 2. Buscar Matrículas Ativas
    const enrollmentsSnapshot = await transaction.get(
        enrollmentsRef
            .where('idClient', '==', idClient)
            .where('status', '==', 'active')
    );

    const activeActivities = [...new Set(enrollmentsSnapshot.docs.map(doc => doc.data().activityName).filter(Boolean))];
    const activeInstructors = [...new Set(enrollmentsSnapshot.docs.map(doc => doc.data().idStaff).filter(Boolean))];

    // 3. Montar objeto Computed (Snapshot Real-time)
    const computed = {
        activeContractId: activeContract ? contractsSnapshot.docs[0].id : null,
        activePlanName: activeContract?.planName || 'Sem Plano',
        contractEndDate: activeContract?.endDate || null,
        monthlyValue: activeContract?.value || 0,
        activeActivities: activeActivities,
        activeInstructors: activeInstructors,
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 4. Atualizar o documento do Cliente dentro da transação
    transaction.update(clientRef, { computed });
}

module.exports = { syncClientComputedFields };
