/**
 * Script de Migração: Padronização do Schema de Colaboradores (Staff)
 * 
 * Este script atualiza todos os colaboradores para incluir campos obrigatórios
 * para o novo sistema, garantindo snapshots de cargos e campos de auditoria.
 * 
 * CAMPOS ADICIONADOS/ATUALIZADOS:
 * - id: (cópia do doc.id)
 * - isActive: (boolean, padronizado de 'active' ou default true)
 * - status: (active, inactive, deleted)
 * - deletedAt: (null)
 * - name: (garantir que exista, concatenando firstName/lastName se necessário)
 * - roleName: (snapshot buscando do ID do cargo se estiver ausente)
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
const BACKUP_DIR = path.join(__dirname, 'migration-backups-staff');

// ==================== INICIALIZAÇÃO ====================

require('dotenv').config();

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
    const backupFile = path.join(BACKUP_DIR, `staff_${tenantId}_${branchId}_${timestamp}.json`);

    const collectionRef = db
        .collection('tenants')
        .doc(tenantId)
        .collection('branches')
        .doc(branchId)
        .collection('staff');

    const snapshot = await collectionRef.get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`💾 Backup: ${backupFile} (${data.length} docs)`);
}

async function migrateStaffMember(docRef, docData, rolesMap) {
    const updates = {};

    // 1. Campo id
    if (!docData.id || docData.id !== docRef.id) {
        updates.id = docRef.id;
    }

    // 2. isActive (padronizar de active ou default true)
    if (!docData.hasOwnProperty('isActive')) {
        updates.isActive = docData.hasOwnProperty('active') ? docData.active : true;
    }

    // 3. Status e Auditoria
    if (!docData.hasOwnProperty('deletedAt')) updates.deletedAt = null;
    if (!docData.status) updates.status = 'active';

    // 4. Garantir Nome (Unificado)
    if (!docData.name && (docData.firstName || docData.lastName)) {
        updates.name = `${docData.firstName || ''} ${docData.lastName || ''}`.trim();
    }

    // 5. Snapshot do Cargo (roleName)
    if (docData.roleId && !docData.roleName) {
        const role = rolesMap[docData.roleId];
        if (role) {
            updates.roleName = role.name || role.label || "";
        }
    }

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
    const result = [];
    for (const tenantDoc of tenantsSnapshot.docs) {
        const branchesSnapshot = await tenantDoc.ref.collection('branches').get();
        for (const branchDoc of branchesSnapshot.docs) {
            result.push({ tenantId: tenantDoc.id, branchId: branchDoc.id });
        }
    }
    return result;
}

async function getRolesMap(tenantId, branchId) {
    const rolesSnapshot = await db.collection('tenants').doc(tenantId).collection('branches').doc(branchId).collection('roles').get();
    const map = {};
    rolesSnapshot.docs.forEach(doc => {
        map[doc.id] = doc.data();
    });
    return map;
}

// ==================== EXECUÇÃO PRINCIPAL ====================

async function main() {
    console.log('🚀 Iniciando Padronização de Colaboradores (Staff)...');

    if (DRY_RUN) {
        console.log('⚠️  MODO DRY-RUN (Simulação). Use --execute para aplicar.\n');
    } else {
        ensureBackupDir();
    }

    const targets = await getTenantsBranches();
    console.log(`📍 Encontrados ${targets.length} contextos (tenant/branch).`);

    let totalProcessed = 0;
    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const { tenantId, branchId } of targets) {
        const staffRef = db.collection('tenants').doc(tenantId).collection('branches').doc(branchId).collection('staff');
        const snapshot = await staffRef.get();

        if (snapshot.empty) continue;

        console.log(`\n🏢 Branch: ${branchId} (${snapshot.size} colaboradores)`);

        if (!DRY_RUN) await backupCollection(tenantId, branchId);

        // Carregar cargos para snapshot
        const rolesMap = await getRolesMap(tenantId, branchId);

        for (const doc of snapshot.docs) {
            totalProcessed++;
            const result = await migrateStaffMember(doc.ref, doc.data(), rolesMap);

            if (result.status === 'migrated' || result.status === 'dry_run') {
                totalMigrated++;
                console.log(`   ✅ ${doc.id}: ${doc.data().name || doc.data().email || 'Sem nome'} -> Atualizado`);
            } else if (result.status === 'skipped') {
                totalSkipped++;
            }
        }
    }

    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║   RESUMO DA MIGRAÇÃO STAFF                       ║`);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║   Total Processados: ${totalProcessed.toString().padEnd(28)}║`);
    console.log(`║   Total Migrados:    ${totalMigrated.toString().padEnd(28)}║`);
    console.log(`║   Total Ignorados:   ${totalSkipped.toString().padEnd(28)}║`);
    console.log(`╚══════════════════════════════════════════════════╝`);

    if (DRY_RUN) console.log('\n⚠️  Lembre-se: Nenhuma alteração real foi feita no modo DRY-RUN.');
}

main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
