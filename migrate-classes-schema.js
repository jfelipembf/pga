/**
 * Script de Migração: Classes Schema Update
 * 
 * Atualiza documentos existentes na coleção 'classes' para o novo padrão:
 * - Remove campo 'deleted' (boolean)
 * - Adiciona campo 'deletedAt' (null para ativos)
 * - Adiciona campos de auditoria se não existirem
 * - Adiciona campo 'status' se não existir
 * 
 * USO:
 * - Dry-run (visualizar mudanças): node migrate-classes-schema.js --dry-run
 * - Executar migração: node migrate-classes-schema.js --execute
 */

const admin = require('firebase-admin');

// ==================== CONFIGURAÇÃO ====================

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

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

// ==================== FUNÇÃO PRINCIPAL ====================

async function migrateClasses() {
    console.log(`\n🚀 Iniciando migração de Classes (${DRY_RUN ? 'DRY-RUN' : 'EXECUTANDO'})...\n`);

    try {
        // Buscar todos os tenants
        const tenantsSnapshot = await db.collection('tenants').get();

        let totalClasses = 0;
        let migratedClasses = 0;

        for (const tenantDoc of tenantsSnapshot.docs) {
            const tenantId = tenantDoc.id;
            console.log(`\n📂 Tenant: ${tenantId}`);

            // Buscar todas as branches do tenant
            const branchesSnapshot = await db
                .collection('tenants')
                .doc(tenantId)
                .collection('branches')
                .get();

            for (const branchDoc of branchesSnapshot.docs) {
                const branchId = branchDoc.id;
                console.log(`  📁 Branch: ${branchId}`);

                // Buscar todas as classes da branch
                const classesSnapshot = await db
                    .collection('tenants')
                    .doc(tenantId)
                    .collection('branches')
                    .doc(branchId)
                    .collection('classes')
                    .get();

                console.log(`    📊 Total de turmas: ${classesSnapshot.size}`);

                for (const classDoc of classesSnapshot.docs) {
                    totalClasses++;
                    const classData = classDoc.data();
                    const classId = classDoc.id;

                    const updates = {};
                    let needsUpdate = false;

                    // 1. Remover campo 'deleted' e adicionar 'deletedAt'
                    if ('deleted' in classData) {
                        updates.deleted = admin.firestore.FieldValue.delete();

                        // Se estava deletado (deleted: true), marca com timestamp
                        // Se não estava (deleted: false), marca como null
                        if (classData.deleted === true) {
                            updates.deletedAt = classData.updatedAt || admin.firestore.Timestamp.now();
                            updates.isActive = false;
                            updates.status = 'deleted';
                        } else {
                            updates.deletedAt = null;
                        }
                        needsUpdate = true;
                    }

                    // 2. Garantir que deletedAt existe (se não foi setado acima)
                    if (!('deletedAt' in classData) && !('deletedAt' in updates)) {
                        updates.deletedAt = null;
                        needsUpdate = true;
                    }

                    // 3. Adicionar campo 'status' se não existir
                    if (!classData.status && !('status' in updates)) {
                        updates.status = classData.isActive !== false ? 'active' : 'inactive';
                        needsUpdate = true;
                    }

                    // 4. Garantir campos de auditoria
                    if (!classData.createdBy) {
                        updates.createdBy = 'migration-script';
                        needsUpdate = true;
                    }

                    if (!classData.updatedBy) {
                        updates.updatedBy = 'migration-script';
                        needsUpdate = true;
                    }

                    // 5. Adicionar campo 'id' se não existir
                    if (!classData.id) {
                        updates.id = classId;
                        needsUpdate = true;
                    }

                    // Aplicar updates se necessário
                    if (needsUpdate) {
                        if (DRY_RUN) {
                            console.log(`      🔍 [DRY-RUN] Seria atualizada: ${classData.name || classId}`);
                            console.log(`         Mudanças:`, Object.keys(updates).join(', '));
                        } else {
                            await db
                                .collection('tenants')
                                .doc(tenantId)
                                .collection('branches')
                                .doc(branchId)
                                .collection('classes')
                                .doc(classId)
                                .update(updates);

                            console.log(`      ✅ Migrada: ${classData.name || classId}`);
                        }
                        migratedClasses++;
                    } else {
                        console.log(`      ⏭️  Já atualizada: ${classData.name || classId}`);
                    }
                }
            }
        }

        console.log('\n✨ Migração concluída!');
        console.log(`📊 Total de turmas processadas: ${totalClasses}`);
        console.log(`🔄 Turmas ${DRY_RUN ? 'que seriam migradas' : 'migradas'}: ${migratedClasses}`);
        console.log(`✅ Turmas já atualizadas: ${totalClasses - migratedClasses}`);

        if (DRY_RUN) {
            console.log('\n⚠️  MODO DRY-RUN ATIVO - Nenhuma alteração foi feita.');
            console.log('   Para executar a migração, use: node migrate-classes-schema.js --execute');
        }

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        throw error;
    }
}

// ==================== EXECUÇÃO ====================

migrateClasses()
    .then(() => {
        console.log('\n🎉 Script finalizado com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script finalizado com erro:', error);
        process.exit(1);
    });
