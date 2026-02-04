const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { createScheduledTrigger } = require("./utils");
const { toISODate, addDays } = require("../shared");

/**
 * Trigger diário para processar tarefas recorrentes.
 * Verifica templates ativos e gera as tarefas do dia.
 * Frequência: Diariamente às 06:00 AM.
 */
module.exports = createScheduledTrigger("40 2 * * *", "processRecurringTasks", async () => {
    const db = admin.firestore();
    const today = new Date();
    // Ajustar para dia local YYYY-MM-DD
    // Using toISODate will use local time of the server, but the previous code was using sv-SE locale with Brazil timezone
    // to simulate YYYY-MM-DD in Brazil. toISODate uses UTC-offset adjustment. 
    // To match original behavior we should stick to the Date construction or adapt toISODate usage.
    // Original: today.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).split("T")[0]
    // The previous code explicitly wanted Brazil time. 
    // Let's keep the logic but use toISODate on the shifted date.
    
    const spDateStr = today.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const todayIso = toISODate(new Date(spDateStr));

    console.log(`[RecurringTasks] Iniciando processamento para: ${todayIso}`);

    try {
        const templatesSnap = await db.collectionGroup("recurringTaskTemplates")
            .where("status", "==", "active")
            .where("nextExecutionDate", "<=", todayIso)
            .get();

        if (templatesSnap.empty) {
            console.log("[RecurringTasks] Nenhuma tarefa recorrente agendada para hoje.");
            return;
        }

        let batch = db.batch();
        let opsCount = 0;
        const BATCH_LIMIT = 400;

        for (const doc of templatesSnap.docs) {
            const template = doc.data();

            // Tenants path handling
            const pathSegments = doc.ref.path.split("/");
            if (pathSegments.length < 4) {
                console.warn(`Template com path inválido: ${doc.ref.path}`);
                continue;
            }
            const tenantId = pathSegments[1];
            const branchId = pathSegments[3];

            // Dados da recorrência
            const currentCount = template.recurrence?.currentOccurrence || 0;
            const thisOccurrenceNum = currentCount + 1;
            const endMode = template.recurrence?.endMode;
            const endValue = Number(template.recurrence?.endValue);

            // Verificação PRELIMINAR de fim por ocorrências
            // Se o usuário pediu 12 no total, e já estamos indo para a 13ª, paramos e não criamos (apenas finalizamos template se estiver aberto).
            if (endMode === 'occurrences' && thisOccurrenceNum > endValue) {
                batch.update(doc.ref, {
                    status: "completed",
                    updatedAt: FieldValue.serverTimestamp()
                });
                opsCount++;
                if (opsCount >= BATCH_LIMIT) { await batch.commit(); batch = db.batch(); opsCount = 0; }
                continue; // Pula criação
            }

            // 1. Criar a nova tarefa
            const newTaskRef = db.collection(`tenants/${tenantId}/branches/${branchId}/tasks`).doc();

            // Adicionar contador na descrição se for finito
            let description = template.description;
            if (endMode === 'occurrences') {
                description = `${description} (${thisOccurrenceNum}/${endValue})`;
            }

            // Payload da nova tarefa
            const taskPayload = {
                description: description,
                dueDate: template.nextExecutionDate, // Data que triggerou
                assignedStaffIds: template.assignedStaffIds || [],
                assignedStaffNames: template.assignedStaffNames || "",
                createdBy: "system_recurrence",
                recurrenceTemplateId: doc.id,
                status: "pending",
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                clientName: template.clientName || ""
            };

            batch.set(newTaskRef, taskPayload);
            opsCount++;

            // 2. Calcular PRÓXIMA execução
            const [y, m, d] = template.nextExecutionDate.split('-').map(Number);
            const nextDateObj = new Date(y, m - 1, d); // Mês 0-index

            // Regra de Frequência
            const freq = template.recurrence?.frequency || 'monthly';
            let nextDate;
            if (freq === 'daily') {
                nextDate = addDays(nextDateObj, 1);
            } else if (freq === 'yearly') {
                nextDate = new Date(nextDateObj.getFullYear() + 1, nextDateObj.getMonth(), nextDateObj.getDate());
            } else {
                // monthly
                nextDate = new Date(nextDateObj.getFullYear(), nextDateObj.getMonth() + 1, nextDateObj.getDate());
            }

            // Formatar YYYY-MM-DD
            const nextDateIso = toISODate(nextDate);

            // 3. Atualizar Template
            // Se é data mode, verifica se a PRÓXIMA data passa do limite. Se sim, marca completed AGORA (mas a tarefa de hoje já foi criada).
            // Se occurrences, se essa foi a última (== endValue), marca completed.

            let shouldFinishDate = false;
            if (endMode === 'date' && nextDateIso > template.recurrence.endValue) {
                shouldFinishDate = true;
            }

            const isLastOccurrence = (endMode === 'occurrences' && thisOccurrenceNum >= endValue);

            if (shouldFinishDate || isLastOccurrence) {
                batch.update(doc.ref, {
                    status: "completed",
                    "recurrence.currentOccurrence": thisOccurrenceNum,
                    updatedAt: FieldValue.serverTimestamp()
                });
            } else {
                batch.update(doc.ref, {
                    nextExecutionDate: nextDateIso,
                    "recurrence.currentOccurrence": thisOccurrenceNum,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
            opsCount++;

            if (opsCount >= BATCH_LIMIT) {
                await batch.commit();
                batch = db.batch();
                opsCount = 0;
            }
        }

        // Commit final
        if (opsCount > 0) {
            await batch.commit();
        }

        console.log(`[RecurringTasks] Processamento concluído. ${templatesSnap.size} templates verificados.`);

    } catch (err) {
        console.error("[RecurringTasks] Erro fatal:", err);
    }
});
