const admin = require("firebase-admin");
const path = require("path");

// Carregar chave da conta de serviço para ACESSO À PRODUÇÃO
const serviceAccountPath = path.resolve(__dirname, "../../firebase-adminsdk-private-key.json");
let serviceAccount;
let prodApp;

try {
    serviceAccount = require(serviceAccountPath);
    console.log("✅ Usando chave JSON local para autenticação.");

    // Inicializar App de PRODUÇÃO (Fonte) com chave
    prodApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    }, "productionApp");

} catch (e) {
    console.log("⚠️ Chave JSON 'firebase-adminsdk-private-key.json' não encontrada na raiz.");
    console.log("🔄 Tentando usar credenciais padrão do Google Cloud (gcloud auth)...");

    try {
        // Tentar autenticação via ambiente (Application Default Credentials)
        prodApp = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: "pgasistema"
        }, "productionApp");
        console.log("✅ Autenticado via Application Default Credentials.");
    } catch (err) {
        console.error("\n❌ ERRO FATAL DE AUTENTICAÇÃO:");
        console.error("Não foi possível conectar ao Firebase de Produção.");
        process.exit(1);
    }
}

const dbProd = prodApp.firestore();

// Inicializar App do EMULADOR (Destino)
const emulatorApp = admin.initializeApp({
    projectId: "pgasistema"
}, "emulatorApp");

const dbEmulator = emulatorApp.firestore();
dbEmulator.settings({
    host: "localhost:8080",
    ssl: false
});

/**
 * Funcao OTIMIZADA para copiar dados necessários para testes de Sessões e Caixa.
 */
async function copyEssentialData() {
    console.log("\n🚀 INICIANDO CÓPIA DE DADOS PARA TESTE (Sessões e Caixa)...");

    try {
        const tenantsSnap = await dbProd.collection("tenants").get();
        console.log(`\nEncontrados ${tenantsSnap.size} tenants na produção.`);

        for (const tenantDoc of tenantsSnap.docs) {
            console.log(`➡️  Copiando Tenant: ${tenantDoc.id}`);
            await dbEmulator.doc(`tenants/${tenantDoc.id}`).set(tenantDoc.data());

            const branchesSnap = await tenantDoc.ref.collection("branches").get();
            for (const branchDoc of branchesSnap.docs) {
                console.log(`   📍 Branch: ${branchDoc.id}`);
                await dbEmulator.doc(`tenants/${tenantDoc.id}/branches/${branchDoc.id}`).set(branchDoc.data());

                // 1. Copiar Turmas (Classes)
                const classesSnap = await branchDoc.ref.collection("classes").get();
                if (!classesSnap.empty) {
                    console.log(`      🎓 Copiando ${classesSnap.size} turmas...`);
                    const batch = dbEmulator.batch();
                    classesSnap.docs.forEach(doc => {
                        batch.set(dbEmulator.doc(`tenants/${tenantDoc.id}/branches/${branchDoc.id}/classes/${doc.id}`), doc.data());
                    });
                    await batch.commit();
                }

                // 2. Copiar algumas sessões (Sessions) - Apenas as 5 mais recentes para teste de horizonte
                const sessionsSnap = await branchDoc.ref.collection("sessions").orderBy("sessionDate", "desc").limit(5).get();
                if (!sessionsSnap.empty) {
                    console.log(`      📅 Copiando ${sessionsSnap.size} sessões recentes...`);
                    const batch = dbEmulator.batch();
                    sessionsSnap.docs.forEach(doc => {
                        batch.set(dbEmulator.doc(`tenants/${tenantDoc.id}/branches/${branchDoc.id}/sessions/${doc.id}`), doc.data());
                    });
                    await batch.commit();
                }

                // 3. Copiar CashierSessions
                const cashierSnap = await branchDoc.ref.collection("cashierSessions").get();
                if (!cashierSnap.empty) {
                    console.log(`      💰 Copiando ${cashierSnap.size} sessões de caixa...`);
                    const batch = dbEmulator.batch();
                    cashierSnap.docs.forEach(doc => {
                        batch.set(dbEmulator.doc(`tenants/${tenantDoc.id}/branches/${branchDoc.id}/cashierSessions/${doc.id}`), doc.data());
                    });
                    await batch.commit();
                }
            }
        }

        console.log("\n✅ CÓPIA CONCLUÍDA!");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ ERRO DURANTE A CÓPIA:", error);
        process.exit(1);
    }
}

copyEssentialData();
