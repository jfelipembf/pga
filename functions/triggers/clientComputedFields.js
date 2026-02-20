const admin = require('firebase-admin');
const { FieldValue } = require("firebase-admin/firestore");

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

    // 1. Buscar Aluno (para manter searchText e outros dados)
    const clientSnap = await transaction.get(clientRef);
    if (!clientSnap.exists) return;
    const clientData = clientSnap.data();

    // 2. Buscar Contratos (Ativos ou Agendados para Cancelamento)
    const contractsSnapshot = await transaction.get(
        contractsRef
            .where('idClient', '==', idClient)
    );

    const contracts = contractsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filtrar contratos para o array computed
    const activeContracts = contracts.filter(c => ['active', 'scheduled_cancellation'].includes(c.status));
    const suspendedContracts = contracts.filter(c => c.status === 'suspended');

    const activeContractsInfo = activeContracts.map(c => ({
        idClientContract: c.id,
        idContract: c.idContract || null,
        planName: c.planName || null,
        planType: c.planType || null,
        value: c.value || null,
        endDate: c.endDate || null
    }));

    // 3. Buscar Matrículas Ativas
    const enrollmentsSnapshot = await transaction.get(
        enrollmentsRef
            .where('idClient', '==', idClient)
            .where('status', '==', 'active')
    );

    const activeActivities = [...new Set(enrollmentsSnapshot.docs.map(doc => doc.data().activityName).filter(Boolean))];
    const activeInstructors = [...new Set(enrollmentsSnapshot.docs.map(doc => doc.data().instructorName).filter(Boolean))];

    // 4. Determinar Status Inteligente do Aluno
    let newStatus = clientData.status;
    let newLifecycle = clientData.lifecycleStatus;

    if (activeContracts.length > 0) {
        newStatus = 'active';
        newLifecycle = 'converted';
    } else if (suspendedContracts.length > 0) {
        newStatus = 'suspended';
    } else {
        // Se não tem nada ativo nem suspenso, mas já foi convertido, vira inativo
        if (newLifecycle === 'converted') {
            newStatus = 'inactive';
        }
    }

    // 5. Montar objeto Computed
    const computed = {
        activeContracts: activeContractsInfo,
        activeActivities: activeActivities,
        activeInstructors: activeInstructors,
        updatedAt: new Date().toISOString()
    };

    // 6. Atualizar o documento do Cliente
    transaction.update(clientRef, {
        computed,
        status: newStatus,
        lifecycleStatus: newLifecycle,
        updatedAt: FieldValue.serverTimestamp()
    });
}

module.exports = { syncClientComputedFields };
