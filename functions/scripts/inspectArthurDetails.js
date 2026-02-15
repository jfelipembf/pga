const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function inspectArthurDetails() {
    console.log("🔍 Inspecionando Arthur Guimarães de Faria...\n");

    // IDs pegos do log anterior
    const idTenant = "99qIS1A2A2n5W93X7yW0"; // Assumindo pelo padrão ou buscando
    // O log anterior não deu o ID do Tenant, mas deu o ID do Branch: QVWiKcua8qCzrx9XzC2p
    // E o ID do Cliente: uzWdzK1VOU6JlR9RkYNM

    // Precisamos achar o Tenant primeiro, ou varrer todos.
    // O jeito mais fácil é varrer tenants como antes para achar o path correto.

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const tId = tenantDoc.id;
            const branchRef = db.collection("tenants").doc(tId)
                .collection("branches").doc("QVWiKcua8qCzrx9XzC2p"); // ID do branch conhecido

            const branchSnap = await branchRef.get();
            if (!branchSnap.exists) continue; // Não é esse tenant

            console.log(`📍 Localizado em Tenant: ${tId}, Branch: ${branchSnap.id}`);

            // Busca Cliente
            const clientRef = branchRef.collection("clients").doc("uzWdzK1VOU6JlR9RkYNM");
            const clientSnap = await clientRef.get();

            if (!clientSnap.exists) {
                console.log("❌ Cliente não encontrado neste caminho.");
                continue;
            }

            const client = clientSnap.data();
            console.log(`\n👤 DADOS DO CLIENTE:`);
            console.log(`   Nome: ${client.name || client.firstName}`);
            console.log(`   Status Atual: [ ${client.status} ]`); // Destaque
            console.log(`   Data Nasc: ${client.birthDate}`);

            // Busca Contratos do Cliente
            const contractsSnap = await clientRef.collection("contracts").get(); // Tenta 'contracts'
            // Se não achar, tenta a collectionGroup ou outro padrão se soubermos. 
            // O padrão do sistema parece ser subcoleção 'contracts' ou 'clientContracts'?
            // Vamos testar 'clientContracts' também.

            const clientContractsSnap = await clientRef.collection("clientContracts").get();

            let foundContracts = [];
            if (!contractsSnap.empty) foundContracts.push(...contractsSnap.docs);
            if (!clientContractsSnap.empty) foundContracts.push(...clientContractsSnap.docs);

            console.log(`\n📄 CONTRATOS (${foundContracts.length}):`);

            if (foundContracts.length === 0) {
                console.log("   Nenhum contrato encontrado.");
            }

            foundContracts.forEach(c => {
                const data = c.data();
                console.log(`   - ID: ${c.id}`);
                console.log(`     Título: ${data.title}`);
                console.log(`     Status: ${data.status}`);
                console.log(`     Vencimento: ${data.endDate ? (data.endDate.toDate ? data.endDate.toDate().toISOString().split('T')[0] : data.endDate) : "N/A"}`);
                console.log(`     Bolsista? ${data.isScholarship}`);
            });

            console.log("\n---------------------------------------------------");
        }

    } catch (error) {
        console.error("❌ Erro:", error);
    }
}

inspectArthurDetails();
