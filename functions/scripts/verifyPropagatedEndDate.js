const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function verifyPropagatedEndDate() {
    console.log("🕵️ [VERIFY] Verificando propagação de EndDate nas últimas turmas editadas...\n");

    try {
        const tenants = await db.collection("tenants").get();
        let allRecent = [];

        for (const t of tenants.docs) {
            const branches = await t.ref.collection("branches").get();
            for (const b of branches.docs) {
                // Tenta ordenar por updatedAt. Se der erro de index, pega tudo e ordena em memória (fallback seguro)
                try {
                    const classes = await b.ref.collection("classes")
                        .orderBy("updatedAt", "desc")
                        .limit(5)
                        .get();

                    classes.forEach(c => {
                        allRecent.push({
                            id: c.id,
                            data: c.data(),
                            ref: c.ref,
                            parentRef: b.ref, // Branch ref
                            tenant: t.id,
                            branch: b.id
                        });
                    });
                } catch (e) {
                    console.log(`⚠️ Falha ao ordenar classes no branch ${b.id} (provavel falta de index). Pulando ordenação.`);
                    // Fallback: Pega as primeiras 20 e ordena em memoria
                    const classes = await b.ref.collection("classes").limit(20).get();
                    classes.forEach(c => {
                        allRecent.push({
                            id: c.id,
                            data: c.data(),
                            ref: c.ref,
                            parentRef: b.ref,
                            tenant: t.id,
                            branch: b.id
                        });
                    });
                }
            }
        }

        // Ordenar globalmente as coletadas
        allRecent.sort((a, b) => {
            const tA = a.data.updatedAt ? a.data.updatedAt.toMillis() : 0;
            const tB = b.data.updatedAt ? b.data.updatedAt.toMillis() : 0;
            return tB - tA;
        });

        const targetClasses = allRecent.slice(0, 3); // Analisa as top 3 mais recentes

        if (targetClasses.length === 0) {
            console.log("Nenhuma turma encontrada.");
            return;
        }

        for (const cls of targetClasses) {
            console.log(`📌 Turma: ${cls.id} (Atualizada em: ${cls.data.updatedAt?.toDate()?.toISOString()})`);
            console.log(`   📂 Tenant: ${cls.tenant} | Branch: ${cls.branch}`);
            console.log(`   📅 Class EndDate: ${cls.data.endDate}`);

            if (!cls.data.endDate) {
                console.log("   ℹ️ Turma sem Data Fim definida. Nada a verificar.\n");
                continue;
            }

            // Buscar sessões dessa turma
            const sessions = await cls.parentRef.collection("sessions")
                .where("idClass", "==", cls.id)
                .get();

            let matchCount = 0;
            let mismatchCount = 0;
            let missingCount = 0;
            let futureSessionsChecked = 0;

            const nowStr = new Date().toISOString().split('T')[0];

            sessions.forEach(s => {
                const sData = s.data();
                // Ignorar sessões passadas (opcional, mas propagação usually afecta futuro)
                if (sData.sessionDate < nowStr) return;

                futureSessionsChecked++;

                if (sData.endDate === cls.data.endDate) {
                    matchCount++;
                } else if (!sData.endDate) {
                    missingCount++;
                } else {
                    mismatchCount++;
                    console.log(`      ❌ Mismatch na sessão ${s.id} (Data: ${sData.sessionDate}): Tem '${sData.endDate}', esperava '${cls.data.endDate}'`);
                }
            });

            console.log(`   📊 Análise de Sessões Futuras (${futureSessionsChecked} sessões):`);
            console.log(`      ✅ Bateu (Match): ${matchCount}`);
            console.log(`      ❌ Diferente (Mismatch): ${mismatchCount}`);
            console.log(`      ⚪ Ausente (Missing in Session): ${missingCount}`);

            if (futureSessionsChecked > 0) {
                if (mismatchCount === 0 && missingCount === 0) {
                    console.log("   🌟 SUCESSO! Propagação verificada.\n");
                } else {
                    console.log("   ⚠️ FALHA! Propagação incompleta.\n");
                }
            } else {
                console.log("   ℹ️ Nenhuma sessão futura para verificar.\n");
            }
        }

    } catch (e) {
        console.error("Erro geral:", e);
    }
}

verifyPropagatedEndDate();
