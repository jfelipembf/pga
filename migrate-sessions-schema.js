/**
 * Script de Migração: Padronização do Schema de Sessões (Sessions)
 * 
 * Este script atualiza todas as sessões para incluir campos obrigatórios
 * para o novo sistema de Grade e Chamada.
 * 
 * CAMPOS ADICIONADOS/ATUALIZADOS:
 * - id: (cópia do doc.id)
 * - isActive: (boolean, default true)
 * - attendanceSnapshot: (null)
 * - presentCount: (0)
 * - absentCount: (0)
 * - deletedAt: (null)
 * - status: (scheduled se vazio)
 * 
 * SEGURANÇA:
 * - Modo dry-run por padrão (não faz alterações)
 * - Backup automático antes de executar
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURAÇÃO ====================

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
const BACKUP_DIR = path.join(__dirname, 'migration-backups-sessions');

// ==================== INICIALIZAÇÃO ====================

require('dotenv').config();

// Inicializar Firebase Admin
console.log(`🔍 Inicializando para o projeto: ${process.env.REACT_APP_PROJECTID}`);
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.REACT_APP_PROJECTID
    });
    console.log("✅ Firebase Admin inicializado.");
} catch (e) {
    console.error("❌ Erro na inicialização:", e.message);
    process.exit(1);
}

const db = admin.firestore();

// ==================== FUNÇÕES AUXILIARES ====================

function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

async function backupCollection(tenantId, branchId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `sessions_${tenantId}_${branchId}_${timestamp}.json`);

    const collectionRef = db
        .collection('tenants')
        .doc(tenantId)
        .collection('branches')
        .doc(branchId)
        .collection('sessions');

    const snapshot = await collectionRef.get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`💾 Backup: ${backupFile} (${data.length} docs)`);
}

async function migrateSession(docRef, docData, tenantId, branchId) {
    const updates = {};

    // 1. Campo id
    if (!docData.id || docData.id !== docRef.id) {
        updates.id = docRef.id;
    }

    // 2. idTenant e idBranch (Crítico para filtros de query)
    if (!docData.idTenant) updates.idTenant = tenantId;
    if (!docData.idBranch) updates.idBranch = branchId;

    // 3. sessionDate (Crítico para filtros de data)
    // Se não tiver sessionDate, tenta pegar de 'date' ou 'activityDate'
    if (!docData.sessionDate) {
        const legacyDate = docData.date || docData.activityDate;
        if (legacyDate) {
            updates.sessionDate = legacyDate;
        }
    }

    // 4. isActive (padronizar de active ou default true)
    if (!docData.hasOwnProperty('isActive')) {
        updates.isActive = docData.hasOwnProperty('active') ? docData.active : true;
    }

    // 5. Campos de Presença
    if (!docData.hasOwnProperty('attendanceSnapshot')) updates.attendanceSnapshot = null;
    if (!docData.hasOwnProperty('presentCount')) updates.presentCount = 0;
    if (!docData.hasOwnProperty('absentCount')) updates.absentCount = 0;
    if (!docData.hasOwnProperty('attendanceRecorded')) updates.attendanceRecorded = false;

    // 6. Campos de Auditoria e Status
    if (!docData.hasOwnProperty('deletedAt')) updates.deletedAt = null;
    if (!docData.status) updates.status = 'scheduled';

    // Sempre atualizar o updatedAt para marcar a migração
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    if (Object.keys(updates).length <= 1) { // Só tem o updatedAt
        return { status: 'skipped', reason: 'already_standard' };
    }

    if (DRY_RUN) {
        return { status: 'dry_run', changes: updates };
    }

    try {
        await docRef.update(updates);
        return { status: 'migrated', changes: updates };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
}

async function getTenantsBranches() {
    console.log("📡 Buscando lista de Tenants...");
    const tenantsSnapshot = await db.collection('tenants').get();
    console.log(`👥 Encontrados ${tenantsSnapshot.size} tenants.`);
    const result = [];
    for (const tenantDoc of tenantsSnapshot.docs) {
        console.log(`   🔸 Buscando branches para tenant: ${tenantDoc.id}`);
        const branchesSnapshot = await tenantDoc.ref.collection('branches').get();
        console.log(`      🔹 Encontradas ${branchesSnapshot.size} branches.`);
        for (const branchDoc of branchesSnapshot.docs) {
            result.push({ tenantId: tenantDoc.id, branchId: branchDoc.id });
        }
    }
    return result;
}

// ==================== EXECUÇÃO PRINCIPAL ====================

async function main() {
    console.log('🚀 Iniciando Padronização de Sessões...');

    if (DRY_RUN) {
        console.log('⚠️  MODO DRY-RUN (Simulação). Use --execute para aplicar.\n');
    } else {
        ensureBackupDir();
    }

    const targets = await getTenantsBranches();
    let totalProcessed = 0;
    let totalMigrated = 0;

    for (const { tenantId, branchId } of targets) {
        console.log(`\n⏳ Verificando Branch: ${branchId} (Tenant: ${tenantId})...`);
        const colRef = db.collection('tenants').doc(tenantId).collection('branches').doc(branchId).collection('sessions');
        const snapshot = await colRef.get();

        if (snapshot.empty) continue;

        console.log(`\n🏢 Branch: ${branchId} (${snapshot.size} sessões)`);

        if (!DRY_RUN) await backupCollection(tenantId, branchId);

        for (const doc of snapshot.docs) {
            totalProcessed++;
            const result = await migrateSession(doc.ref, doc.data(), tenantId, branchId);

            if (result.status === 'migrated' || result.status === 'dry_run') {
                totalMigrated++;
                console.log(`   ✅ ${doc.id}: Atualizado`);
            }
        }
    }

    console.log(`\n✅ Concluído! Processados: ${totalProcessed} | Atualizados: ${totalMigrated}`);
    if (DRY_RUN) console.log('⚠️  Lembre-se: Nenhuma alteração real foi feita no modo DRY-RUN.');
}

main().catch(error => {
    console.error('❌ Erro fatale:', error);
    process.exit(1);
});
