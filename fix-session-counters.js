/**
 * Script para corrigir contadores de matrícula (enrolledCount) nas sessões
 * 
 * Este script:
 * 1. Varre todos os tenants e branches
 * 2. Varre todas as sessões (não deletadas)
 * 3. Conta os documentos na subcoleção 'enrolledClients' (que não estão deletados)
 * 4. Atualiza o campo enrolledCount na sessão se houver divergência
 * 
 * Uso:
 * Dry Run (apenas simula): node fix-session-counters.js
 * Executar: node fix-session-counters.js --execute
 */

const admin = require('firebase-admin');
require('dotenv').config();

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

// Inicializar Firebase Admin
// Tenta usar credenciais padrão ou do ambiente
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.REACT_APP_PROJECTID
    });
} catch (e) {
    console.error("Erro ao inicializar Firebase. Verifique se GOOGLE_APPLICATION_CREDENTIALS está definido ou se você está logado via gcloud.");
    console.error(e);
    process.exit(1);
}

const db = admin.firestore();

async function getTenantsBranches() {
    const tenantsSnapshot = await db.collection('tenants').get();
    const result = [];

    for (const tenantDoc of tenantsSnapshot.docs) {
        const branchesSnapshot = await tenantDoc.ref.collection('branches').get();

        for (const branchDoc of branchesSnapshot.docs) {
            result.push({
                tenantId: tenantDoc.id,
                branchId: branchDoc.id
            });
        }
    }

    return result;
}

async function fixSessionCounters() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   FIX: Session Enrolled Counters                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (DRY_RUN) {
        console.log('⚠️  MODO DRY-RUN - Nenhuma alteração será feita\n');
        console.log('Use --execute para aplicar as correções.\n');
    } else {
        console.log('🔥 MODO EXECUÇÃO - Corrigindo contadores...\n');
    }

    const tenantsBranches = await getTenantsBranches();

    let totalChecked = 0;
    let totalFixed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const { tenantId, branchId } of tenantsBranches) {
        console.log(`\n🏢 Tenant: ${tenantId} | Branch: ${branchId}`);

        const sessionsRef = db
            .collection('tenants')
            .doc(tenantId)
            .collection('branches')
            .doc(branchId)
            .collection('sessions');

        // Buscar sessões não deletadas
        const sessionsSnapshot = await sessionsRef.where('deletedAt', '==', null).get();

        if (sessionsSnapshot.empty) {
            console.log('   ⚠️  Sem sessões ativas');
            continue;
        }

        console.log(`   Analizando ${sessionsSnapshot.size} sessões...`);

        // Processar em lotes/paralelo limitado seria ideal, mas sequencial é mais seguro para script de fix
        for (const doc of sessionsSnapshot.docs) {
            totalChecked++;
            const sessionData = doc.data();
            const currentCount = sessionData.enrolledCount || 0;

            try {
                // Contar enrollments reais (não deletados)
                const enrolledRef = doc.ref.collection('enrolledClients');
                const enrolledSnapshot = await enrolledRef.where('deleted', '==', false).get();
                const realCount = enrolledSnapshot.size;

                if (currentCount !== realCount) {
                    const diff = realCount - currentCount;
                    const msg = `   🔴 [FIX NEEDED] Sessão ${doc.id} (${sessionData.sessionDate}): Count=${currentCount} | Real=${realCount} (Diff: ${diff > 0 ? '+' + diff : diff})`;
                    console.log(msg);

                    if (!DRY_RUN) {
                        await doc.ref.update({
                            enrolledCount: realCount,
                            updatedBy: 'system-fix-script',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log(`      ✅ Corrigido para ${realCount}`);
                        totalFixed++;
                    } else {
                        totalFixed++; // Contabiliza como "seria corrigido"
                    }
                } else {
                    totalSkipped++;
                    // Opcional: Logar sessões corretas (pode poluir muito)
                    // console.log(`   OK Sessão ${doc.id}`);
                }
            } catch (err) {
                console.error(`   ❌ ERRO na sessão ${doc.id}:`, err.message);
                totalErrors++;
            }
        }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   RESUMO                                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`🔍 Total Verificado: ${totalChecked}`);
    console.log(`✅ Corrigidos (ou a corrigir): ${totalFixed}`);
    console.log(`⏭️  Corretos (Pulados): ${totalSkipped}`);
    console.log(`❌ Erros: ${totalErrors}`);

    if (DRY_RUN) {
        console.log('\n⚠️  DRY-RUN CONCLUÍDO.');
        console.log('Para aplicar as correções, execute:');
        console.log('   node fix-session-counters.js --execute');
    } else {
        console.log('\n✅ Correção concluída!');
    }
}

fixSessionCounters()
    .then(() => {
        // Aguarda um pouco para garantir escrita de logs se houver buffers
        setTimeout(() => process.exit(0), 1000);
    })
    .catch(error => {
        console.error('❌ ERRO CRÍTICO:', error);
        process.exit(1);
    });
