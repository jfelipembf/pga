const admin = require("firebase-admin");

// Inicializa com credenciais padrão. Se já estiver inicializado, usa a existente.
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function testBirthdayAutomation() {
    console.log("🧪 Iniciando TESTE de busca de aniversariantes para HOJE...\n");

    // Obter data atual em SP e extrair Mês e Dia (FORMATO: MM-DD)
    const now = new Date();
    const today = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const birthdaySuffix = today.substring(5); // MM-DD

    console.log(`Hoje em SP: ${today} (Procurando sufixo: ${birthdaySuffix})\n`);

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            // console.log(`Inspecionando Tenant: ${idTenant}`);

            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                const clientsSnap = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("clients")
                    .get(); // Removido filtro de ativo para debug total

                if (clientsSnap.empty) continue;

                console.log(`\n📂 Verificando ${clientsSnap.size} clientes na unidade ${idBranch}...`);

                for (const doc of clientsSnap.docs) {
                    const client = doc.data();

                    // Verifica birthDate e dataNascimento para garantir
                    const bDate = client.birthDate || client.dataNascimento;
                    const name = client.name || client.firstName || "Sem Nome";

                    if (!bDate) continue; // Pula quem não tem data

                    let matches = false;

                    // Tenta casar string direta (YYYY-MM-DD)
                    if (typeof bDate === 'string' && bDate.endsWith(birthdaySuffix)) {
                        matches = true;
                    }
                    // Tenta converter se for Timestamp ou outro formato
                    else if (bDate && bDate.toDate) {
                        const dateObj = bDate.toDate();
                        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const d = String(dateObj.getDate()).padStart(2, '0');
                        if (`${m}-${d}` === birthdaySuffix) matches = true;
                    }

                    if (matches) {
                        console.log(`🎉 ANIVERSARIANTE: ${name} (ID: ${doc.id})`);
                        console.log(`   - Status (Cadastro): ${client.status}`);
                        console.log(`   - Data Nasc: ${bDate}`);

                        // VERIFICA SE ESTÁ ATIVO PARA ENVIAR
                        // IGNORA status do cliente, foca apenas em contrato ativo.
                        let isActive = false;

                        console.log(`   🔍 Verificando contratos ativos...`);
                        const activeContractsSnap = await db.collection("tenants").doc(idTenant)
                            .collection("branches").doc(idBranch)
                            .collection("clientContracts")
                            .where("idClient", "==", doc.id)
                            .where("status", "==", "active")
                            .limit(1)
                            .get();

                        if (!activeContractsSnap.empty) {
                            console.log(`   ✅ Contrato ATIVO encontrado! (ID: ${activeContractsSnap.docs[0].id})`);
                            isActive = true;
                        } else {
                            console.log(`   ❌ Nenhum contrato ativo encontrado.`);
                        }

                        if (isActive) {
                            console.log(`   ✅ RESULTADO: Mensagem SERIA enviada.`);
                        } else {
                            console.log(`   ⛔ RESULTADO: Mensagem NÃO seria enviada (Cliente Inativo).`);
                        }
                        console.log("");
                    }
                }
            }
        }
        console.log("✅ Fim do teste.");

    } catch (error) {
        console.error("❌ Erro durante o teste:", error);
    }
}

testBirthdayAutomation();
