const admin = require("firebase-admin");

// Inicializa com credenciais padrão se não houver app
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "pgasistema"
    });
}

const db = admin.firestore();

// Configuração
const TARGET_TENANT = 'rfu0CcAjKx2eonYksTYw';
const TARGET_BRANCH = 'QVWiKcua8qCzrx9XzC2p';
const FIX_SESSION_COUNTS = false;
const TARGET_STUDENT_NAME = 'Roger'; // Filtro GLOBAL para achar onde ele está

async function checkEnrollmentsLimit() {
    let totalIssues = 0;
    let totalMissing = 0;

    console.log(`\n🔍 Iniciando verificação de limites de matrícula e sessões...`);
    console.log(`Tenant: ${TARGET_TENANT}`);
    console.log(`Branch: ${TARGET_BRANCH}`);
    console.log(`Modo Correção: ${FIX_SESSION_COUNTS ? 'ATIVADO' : 'DESATIVADO'}\n`);

    try {
        // 1. Buscar todas as Turmas Ativas
        const classesRef = db.collection(`tenants/${TARGET_TENANT}/branches/${TARGET_BRANCH}/classes`);
        const classesSnap = await classesRef.where('status', '==', 'active').get();

        if (classesSnap.empty) {
            console.log("Nenhuma turma ativa encontrada.");
            return;
        }

        console.log(`Encontradas ${classesSnap.size} turmas ativas.`);

        for (const classDoc of classesSnap.docs) {
            const classData = classDoc.data();
            const classId = classDoc.id;

            console.log(`\n--------------------------------------------------`);
            const className = classData.name || classData.activityName || 'Nome Indefinido';
            // Buscando...

            // 2. Buscar Alunos (TODOS status)
            const enrollmentsRef = db.collection(`tenants/${TARGET_TENANT}/branches/${TARGET_BRANCH}/enrollments`);
            const enrollmentsSnap = await enrollmentsRef
                .where('idClass', '==', classId)
                .get();

            const allStudents = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Verificar Roger
            const targetStudent = allStudents.find(s => s.clientName && s.clientName.toLowerCase().includes(TARGET_STUDENT_NAME.toLowerCase()));
            if (!targetStudent) continue;

            console.log(`\n--------------------------------------------------`);
            // const className = classData.name || classData.activityName || 'Nome Indefinido';
            console.log(`🎯 TURMA ENCONTRADA COM ROGER: ${className} (ID: ${classId})`);
            console.log(`   Dia: ${classData.weekday} | Hora: ${classData.startTime}`);
            console.log(`   Roger Status: ${targetStudent.status} | ID Enrollment: ${targetStudent.id}`);

            const activeStudents = allStudents.filter(s => s.status === 'active');
            console.log(`   Alunos Ativos na Turma: ${activeStudents.length}`);
            // activeStudents.forEach(s => console.log(` - ${s.clientName}`));

            // Comparar enrolledCount da Turma com real
            const currentBadge = classData.enrolledCount || 0;
            console.log(`   [Badge Turma] Banco: ${currentBadge} | Real (Active Enrollments): ${activeStudents.length}`);

            if (currentBadge !== activeStudents.length) {
                console.warn(`   ⚠️ DIVERGÊNCIA DE BADGE!`);

                // Usando a mesma flag para correção se desejado
                if (FIX_SESSION_COUNTS) {
                    await classDoc.ref.update({ enrolledCount: activeStudents.length });
                    console.log(`   🛠️ Contador da turma corrigido.`);
                }
            }

            // 3. Verificar Sessões Futuras
            const todayStr = new Date().toISOString().split('T')[0];
            const sessionsRef = db.collection(`tenants/${TARGET_TENANT}/branches/${TARGET_BRANCH}/sessions`);
            const sessionsSnap = await sessionsRef
                .where('idClass', '==', classId)
                .where('sessionDate', '>=', todayStr)
                .orderBy('sessionDate')
                .get();

            if (sessionsSnap.empty) {
                console.log(`  (Nenhuma sessão futura encontrada)`);
                continue;
            }

            console.log(`  Verificando ${sessionsSnap.size} sessões futuras...`);

            for (const sessionDoc of sessionsSnap.docs) {
                const sessionData = sessionDoc.data();
                const sessionId = sessionDoc.id;

                // Buscar subcoleção enrolledClients da sessão
                const enrolledClientsRef = sessionDoc.ref.collection('enrolledClients');
                const enrolledClientsSnap = await enrolledClientsRef.where('deleted', '==', false).get();

                const sessionStudents = enrolledClientsSnap.docs.map(d => d.data());
                const sessionStudentIds = sessionStudents.map(s => s.idClient);
                const realSessionCount = sessionStudents.length;

                // Analisar Discrepâncias
                const missingInSession = activeStudents.filter(s => !sessionStudentIds.includes(s.idClient));
                const countMismatch = (sessionData.enrolledCount || 0) !== realSessionCount;

                if (countMismatch || missingInSession.length > 0) {
                    totalIssues++;
                    totalMissing += missingInSession.length;
                    console.log(`  📅 [${sessionData.sessionDate}] Sessão ID: ${sessionId}`);

                    if (countMismatch) {
                        console.log(`     ❌ ERRO CONTADOR: Doc diz ${sessionData.enrolledCount || 0}, Subcoleção tem ${realSessionCount}`);
                    }

                    if (missingInSession.length > 0) {
                        console.log(`     ⚠️ ALUNOS DA TURMA FALTANDO NA SESSÃO: ${missingInSession.length}`);
                        missingInSession.forEach(m => console.log(`        - ${m.clientName} (${m.idClient})`));
                    }

                    // CORREÇÃO
                    if (FIX_SESSION_COUNTS) {
                        const batch = db.batch();
                        let added = 0;

                        // 1. Adicionar alunos faltantes
                        for (const student of missingInSession) {
                            const newDocRef = enrolledClientsRef.doc(student.id); // Usamos o ID do enrollment
                            batch.set(newDocRef, {
                                enrollmentId: student.id,
                                idClient: student.idClient,
                                clientName: student.clientName,
                                enrollmentType: student.enrollmentType || 'regular',
                                attended: null,
                                createdBy: 'script_fix',
                                enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                                deleted: false
                            });
                            added++;
                        }

                        // 2. Atualizar contador da sessão
                        const newTotal = realSessionCount + added;
                        if ((sessionData.enrolledCount || 0) !== newTotal) {
                            batch.update(sessionDoc.ref, {
                                enrolledCount: newTotal,
                                updatedAt: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }

                        await batch.commit();
                        console.log(`     ✅ CORRIGIDO: Adicionados ${added} alunos. Novo contador: ${newTotal}`);
                    }
                }
            }
        }

    } catch (error) {
        console.error("Erro ao executar script:", error);
    } finally {
        console.log(`\n==================================================`);
        console.log(`Verificação Concluída.`);
        console.log(`Sessões com problemas: ${totalIssues}`);
        console.log(`Total de alunos a adicionar/corrigir: ${totalMissing}`);
        console.log(`Para aplicar as correções, altere a constante FIX_SESSION_COUNTS para true no início do arquivo.`);
        console.log(`==================================================\n`);
    }
}

checkEnrollmentsLimit();
