const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Processa diariamente os contratos que vencem hoje.
 * 
 * 1. Itera sobre todos os branches.
 * 2. Identifica contratos ativos com endDate == HOJE.
 * 3. Atualiza o cache do Dashboard em operationalSummary/expirations.
 */
async function processDailyExpirations() {
    const branchesSnap = await db.collectionGroup("branches").get();

    if (branchesSnap.empty) return;

    const promises = branchesSnap.docs.map(async (branchDoc) => {
        try {
            const idBranch = branchDoc.id;
            const branchPath = branchDoc.ref.path;
            const pathSegments = branchPath.split("/");
            const idTenant = pathSegments[1];

            await processBranchExpirations(idTenant, idBranch);
        } catch (err) {
            console.error(`[ExpirationCheck] Error processing branch ${branchDoc.id}:`, err);
        }
    });

    await Promise.all(promises);
}

/**
 * Processa um único branch: Busca contratos vencendo hoje e atualiza dashboard.
 */
async function processBranchExpirations(idTenant, idBranch) {
    // Definir "HOJE" em SP
    const now = new Date();
    const spDateString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const todaySP = new Date(spDateString);
    const todayIso = todaySP.toISOString().split("T")[0];

    // Buscar contratos ativos desse branch que vencem hoje
    const contractsRef = db.collection("tenants").doc(idTenant)
        .collection("branches").doc(idBranch)
        .collection("clientsContracts");

    const contractsSnap = await contractsRef
        .where("status", "==", "active")
        .where("endDate", "==", todayIso)
        .get();

    const expirationsList = [];

    if (!contractsSnap.empty) {
        for (const doc of contractsSnap.docs) {
            const data = doc.data();

            // Buscar dados do cliente para pegar foto e nome
            const clientSnap = await db.collection("tenants").doc(idTenant)
                .collection("branches").doc(idBranch)
                .collection("clients").doc(data.idClient).get();

            const clientData = clientSnap.exists ? clientSnap.data() : {};

            expirationsList.push({
                id: doc.id,
                clientId: data.idClient,
                name: clientData.name || "Cliente",
                photo: clientData.photo || "",
                contractTitle: data.contractTitle || "Contrato",
                endDate: data.endDate
            });
        }
    }

    // Salvar Cache no Firestore para o Dashboard
    const summaryRef = db.collection("tenants").doc(idTenant)
        .collection("branches").doc(idBranch)
        .collection("operationalSummary").doc("expirations");

    await summaryRef.set({
        list: expirationsList,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
}

module.exports = {
    processDailyExpirations
};
