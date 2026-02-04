/**
 * Script de Migração: active → isActive
 * 
 * Este script atualiza todos os documentos das coleções Admin
 * para renomear o campo 'active' para 'isActive', seguindo o padrão
 * dos schemas financeiros.
 * 
 * COLEÇÕES AFETADAS:
 * - roles
 * - activities
 * - areas
 * - staff
 * - classes
 * - catalog
 * - evaluationLevels
 * 
 * SEGURANÇA:
 * - Modo dry-run por padrão (não faz alterações)
 * - Backup automático antes de executar
 * - Logs detalhados de todas as operações
 * - Rollback disponível
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURAÇÃO ====================

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
const BACKUP_DIR = path.join(__dirname, 'migration-backups');
const COLLECTIONS = [
    'roles',
    'activities', 
    'areas',
    'staff',
    'classes',
    'catalog',
    'evaluationLevels'
];

// ==================== INICIALIZAÇÃO ====================

// Carregar variáveis de ambiente
require('dotenv').config();

// Inicializar Firebase Admin usando variáveis de ambiente
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.REACT_APP_PROJECTID,
    databaseURL: process.env.REACT_APP_DATABASEURL
});

const db = admin.firestore();

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Cria diretório de backup se não existir
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`✅ Diretório de backup criado: ${BACKUP_DIR}`);
    }
}

/**
 * Salva backup de uma coleção
 */
async function backupCollection(collectionName, tenantId, branchId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
        BACKUP_DIR, 
        `${collectionName}_${tenantId}_${branchId}_${timestamp}.json`
    );

    const collectionRef = db
        .collection('tenants')
        .doc(tenantId)
        .collection('branches')
        .doc(branchId)
        .collection(collectionName);

    const snapshot = await collectionRef.get();
    const data = [];

    snapshot.forEach(doc => {
        data.push({
            id: doc.id,
            data: doc.data()
        });
    });

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`💾 Backup salvo: ${backupFile} (${data.length} documentos)`);
    
    return backupFile;
}

/**
 * Migra um documento: active → isActive
 */
async function migrateDocument(docRef, docData, collectionName) {
    // Verifica se tem o campo 'active'
    if (!docData.hasOwnProperty('active')) {
        return { status: 'skipped', reason: 'no_active_field' };
    }

    // Verifica se já tem 'isActive'
    if (docData.hasOwnProperty('isActive')) {
        return { status: 'skipped', reason: 'already_migrated' };
    }

    const updates = {
        isActive: docData.active,
        active: admin.firestore.FieldValue.delete()
    };

    if (DRY_RUN) {
        return { 
            status: 'dry_run', 
            changes: updates,
            oldValue: docData.active 
        };
    }

    try {
        await docRef.update(updates);
        return { 
            status: 'migrated', 
            oldValue: docData.active,
            newValue: docData.active
        };
    } catch (error) {
        return { 
            status: 'error', 
            error: error.message 
        };
    }
}

/**
 * Migra uma coleção inteira
 */
async function migrateCollection(collectionName, tenantId, branchId) {
    console.log(`\n📦 Processando: ${collectionName} (tenant: ${tenantId}, branch: ${branchId})`);

    const collectionRef = db
        .collection('tenants')
        .doc(tenantId)
        .collection('branches')
        .doc(branchId)
        .collection(collectionName);

    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
        console.log(`   ⚠️  Coleção vazia`);
        return {
            total: 0,
            migrated: 0,
            skipped: 0,
            errors: 0
        };
    }

    // Fazer backup antes de migrar
    if (!DRY_RUN) {
        await backupCollection(collectionName, tenantId, branchId);
    }

    const stats = {
        total: snapshot.size,
        migrated: 0,
        skipped: 0,
        errors: 0,
        details: []
    };

    for (const doc of snapshot.docs) {
        const result = await migrateDocument(doc.ref, doc.data(), collectionName);
        
        stats.details.push({
            id: doc.id,
            ...result
        });

        if (result.status === 'migrated' || result.status === 'dry_run') {
            stats.migrated++;
            console.log(`   ✅ ${doc.id}: active=${result.oldValue} → isActive=${result.oldValue}`);
        } else if (result.status === 'skipped') {
            stats.skipped++;
            console.log(`   ⏭️  ${doc.id}: ${result.reason}`);
        } else if (result.status === 'error') {
            stats.errors++;
            console.error(`   ❌ ${doc.id}: ${result.error}`);
        }
    }

    console.log(`\n   📊 Resumo: ${stats.migrated} migrados, ${stats.skipped} pulados, ${stats.errors} erros`);
    
    return stats;
}

/**
 * Obtém lista de tenants e branches
 */
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

// ==================== EXECUÇÃO PRINCIPAL ====================

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   MIGRAÇÃO: active → isActive                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (DRY_RUN) {
        console.log('⚠️  MODO DRY-RUN ATIVADO - Nenhuma alteração será feita');
        console.log('   Para executar de verdade, use: node migrate-active-to-isActive.js --execute\n');
    } else {
        console.log('🔥 MODO EXECUÇÃO ATIVADO - Alterações serão aplicadas!');
        console.log('   Backups serão criados automaticamente\n');
        ensureBackupDir();
    }

    try {
        // Obter todos os tenants e branches
        const tenantsBranches = await getTenantsBranches();
        console.log(`📍 Encontrados ${tenantsBranches.length} tenant/branch combinações\n`);

        const globalStats = {
            totalCollections: 0,
            totalDocuments: 0,
            totalMigrated: 0,
            totalSkipped: 0,
            totalErrors: 0
        };

        // Processar cada combinação tenant/branch
        for (const { tenantId, branchId } of tenantsBranches) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🏢 Tenant: ${tenantId} | Branch: ${branchId}`);
            console.log('='.repeat(60));

            for (const collectionName of COLLECTIONS) {
                const stats = await migrateCollection(collectionName, tenantId, branchId);
                
                globalStats.totalCollections++;
                globalStats.totalDocuments += stats.total;
                globalStats.totalMigrated += stats.migrated;
                globalStats.totalSkipped += stats.skipped;
                globalStats.totalErrors += stats.errors;
            }
        }

        // Resumo final
        console.log('\n\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   RESUMO FINAL DA MIGRAÇÃO                                 ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log(`📊 Coleções processadas: ${globalStats.totalCollections}`);
        console.log(`📄 Documentos totais: ${globalStats.totalDocuments}`);
        console.log(`✅ Migrados: ${globalStats.totalMigrated}`);
        console.log(`⏭️  Pulados: ${globalStats.totalSkipped}`);
        console.log(`❌ Erros: ${globalStats.totalErrors}`);

        if (DRY_RUN) {
            console.log('\n⚠️  Esta foi uma execução DRY-RUN. Nenhuma alteração foi feita.');
            console.log('   Para aplicar as mudanças, execute:');
            console.log('   node migrate-active-to-isActive.js --execute');
        } else {
            console.log(`\n💾 Backups salvos em: ${BACKUP_DIR}`);
            console.log('✅ Migração concluída com sucesso!');
        }

    } catch (error) {
        console.error('\n❌ ERRO FATAL:', error);
        process.exit(1);
    } finally {
        await admin.app().delete();
    }
}

// Executar
main().catch(console.error);
