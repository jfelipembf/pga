/**
 * Script de Rollback: isActive → active
 * 
 * Restaura documentos a partir de um arquivo de backup
 * criado pelo script de migração.
 * 
 * USO:
 * node rollback-migration.js --backup-file migration-backups/roles_tenant123_branch456_2026-02-03T14-30-00-000Z.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURAÇÃO ====================

const args = process.argv.slice(2);
const backupFileArg = args.find(arg => arg.startsWith('--backup-file='));
const DRY_RUN = args.includes('--dry-run') || !args.includes('--execute');

if (!backupFileArg) {
    console.error('❌ Erro: Especifique o arquivo de backup');
    console.log('\nUso:');
    console.log('  node rollback-migration.js --backup-file=migration-backups/roles_tenant123_branch456_2026-02-03T14-30-00-000Z.json --execute');
    console.log('\nOu em dry-run:');
    console.log('  node rollback-migration.js --backup-file=migration-backups/roles_tenant123_branch456_2026-02-03T14-30-00-000Z.json --dry-run');
    process.exit(1);
}

const BACKUP_FILE = backupFileArg.split('=')[1];

// ==================== INICIALIZAÇÃO ====================

// Carregar variáveis de ambiente
require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.REACT_APP_PROJECTID,
    databaseURL: process.env.REACT_APP_DATABASEURL
});

const db = admin.firestore();

// ==================== FUNÇÕES ====================

async function rollback() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   ROLLBACK: Restaurar Backup                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (DRY_RUN) {
        console.log('⚠️  MODO DRY-RUN - Nenhuma alteração será feita\n');
    } else {
        console.log('🔥 MODO EXECUÇÃO - Restaurando backup...\n');
    }

    // Ler arquivo de backup
    if (!fs.existsSync(BACKUP_FILE)) {
        console.error(`❌ Arquivo de backup não encontrado: ${BACKUP_FILE}`);
        process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    console.log(`📄 Backup carregado: ${backupData.length} documentos`);

    // Extrair informações do nome do arquivo
    const fileName = path.basename(BACKUP_FILE, '.json');
    const [collectionName, tenantId, branchId] = fileName.split('_');

    console.log(`📦 Coleção: ${collectionName}`);
    console.log(`🏢 Tenant: ${tenantId}`);
    console.log(`🌿 Branch: ${branchId}\n`);

    const collectionRef = db
        .collection('tenants')
        .doc(tenantId)
        .collection('branches')
        .doc(branchId)
        .collection(collectionName);

    let restored = 0;
    let errors = 0;

    for (const doc of backupData) {
        try {
            if (DRY_RUN) {
                console.log(`   ✅ [DRY-RUN] Restauraria: ${doc.id}`);
                restored++;
            } else {
                await collectionRef.doc(doc.id).set(doc.data);
                console.log(`   ✅ Restaurado: ${doc.id}`);
                restored++;
            }
        } catch (error) {
            console.error(`   ❌ Erro ao restaurar ${doc.id}:`, error.message);
            errors++;
        }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   RESUMO DO ROLLBACK                                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Restaurados: ${restored}`);
    console.log(`❌ Erros: ${errors}`);

    if (DRY_RUN) {
        console.log('\n⚠️  Esta foi uma execução DRY-RUN.');
        console.log('   Para executar de verdade, adicione --execute');
    } else {
        console.log('\n✅ Rollback concluído!');
    }
}

// Executar
rollback()
    .then(() => admin.app().delete())
    .catch(error => {
        console.error('❌ ERRO FATAL:', error);
        process.exit(1);
    });
