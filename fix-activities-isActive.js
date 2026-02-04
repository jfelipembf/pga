/**
 * Script para corrigir Activities que ainda não têm isActive
 * 
 * Este script adiciona o campo isActive=true para atividades que:
 * - Não têm o campo isActive
 * - Não têm o campo active
 * - Ou têm active mas não isActive
 */

const admin = require('firebase-admin');
require('dotenv').config();

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.REACT_APP_PROJECTID,
    databaseURL: process.env.REACT_APP_DATABASEURL
});

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

async function fixActivities() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   FIX: Activities isActive                                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (DRY_RUN) {
        console.log('⚠️  MODO DRY-RUN - Nenhuma alteração será feita\n');
    } else {
        console.log('🔥 MODO EXECUÇÃO - Corrigindo atividades...\n');
    }

    const tenantsBranches = await getTenantsBranches();
    let totalFixed = 0;
    let totalSkipped = 0;

    for (const { tenantId, branchId } of tenantsBranches) {
        console.log(`\n🏢 Tenant: ${tenantId} | Branch: ${branchId}`);
        
        const activitiesRef = db
            .collection('tenants')
            .doc(tenantId)
            .collection('branches')
            .doc(branchId)
            .collection('activities');

        const snapshot = await activitiesRef.get();

        if (snapshot.empty) {
            console.log('   ⚠️  Sem atividades');
            continue;
        }

        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Caso 1: Tem active mas não tem isActive - copiar valor
            if (data.hasOwnProperty('active') && !data.hasOwnProperty('isActive')) {
                const updates = {
                    isActive: data.active,
                    active: admin.firestore.FieldValue.delete()
                };
                
                if (DRY_RUN) {
                    console.log(`   ✅ [DRY] ${doc.id}: active=${data.active} → isActive=${data.active}`);
                } else {
                    await doc.ref.update(updates);
                    console.log(`   ✅ ${doc.id}: active=${data.active} → isActive=${data.active}`);
                }
                totalFixed++;
            }
            // Caso 2: Não tem nem active nem isActive - adicionar isActive=true
            else if (!data.hasOwnProperty('active') && !data.hasOwnProperty('isActive')) {
                const updates = {
                    isActive: true
                };
                
                if (DRY_RUN) {
                    console.log(`   ✅ [DRY] ${doc.id}: Adicionando isActive=true`);
                } else {
                    await doc.ref.update(updates);
                    console.log(`   ✅ ${doc.id}: Adicionando isActive=true`);
                }
                totalFixed++;
            }
            // Caso 3: Já tem isActive - pular
            else if (data.hasOwnProperty('isActive')) {
                console.log(`   ⏭️  ${doc.id}: Já tem isActive`);
                totalSkipped++;
            }
        }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   RESUMO                                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Corrigidos: ${totalFixed}`);
    console.log(`⏭️  Pulados: ${totalSkipped}`);

    if (DRY_RUN) {
        console.log('\n⚠️  DRY-RUN - Para aplicar execute:');
        console.log('   node fix-activities-isActive.js --execute');
    } else {
        console.log('\n✅ Correção concluída!');
    }
}

fixActivities()
    .then(() => admin.app().delete())
    .catch(error => {
        console.error('❌ ERRO:', error);
        process.exit(1);
    });
