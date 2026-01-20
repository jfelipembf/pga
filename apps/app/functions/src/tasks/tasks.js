const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");
const { saveAuditLog } = require("../shared/audit");

const db = admin.firestore();

/**
 * Marca uma tarefa como concluída e gera log de auditoria.
 */
exports.completeTask = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
        console.log(`[completeTask] Iniciando para tenant=${idTenant}, branch=${idBranch}, user=${uid}`);

        const { taskId, clientName: uiClientName, observations } = data; // uiClientName if we want to pass it from UI

        if (!taskId) {
            throw new functions.https.HttpsError("invalid-argument", "taskId é obrigatório.");
        }

        const taskRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("tasks")
            .doc(taskId);

        const taskSnap = await taskRef.get();
        if (!taskSnap.exists) {
            console.error(`[completeTask] Tarefa ${taskId} não encontrada.`);
            throw new functions.https.HttpsError("not-found", "Tarefa não encontrada.");
        }

        const task = taskSnap.data();

        const updatePayload = {
            status: "completed",
            completedAt: FieldValue.serverTimestamp(),
            completedBy: uid,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (observations) {
            updatePayload.observations = observations;
        }

        await taskRef.update(updatePayload);

        // Auditoria
        try {
            const staffName = token?.name || token?.email || uid;
            const targetNames = task.clientName || uiClientName || task.assignedStaffNames || 'unassigned';

            await saveAuditLog({
                idTenant, idBranch, uid,
                userName: staffName,
                action: "TASK_COMPLETE",
                targetId: taskId,
                description: `Concluiu tarefa: ${task.description || taskId}`,
                metadata: {
                    description: task.description || "",
                    clientName: targetNames || "",
                    observations: observations || ""
                }
            });
        } catch (auditError) {
            console.error("Falha silenciosa na auditoria de conclusão de tarefa:", auditError);
        }

        return { success: true };
    } catch (e) {
        console.error("[completeTask] Erro fatal:", e);
        throw e;
    }
});

/**
 * Atualiza o status de uma tarefa (ex: Iniciar, Cancelar)
 */
exports.updateTaskStatus = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
        const { taskId, status, observations } = data;

        if (!taskId || !status) {
            throw new functions.https.HttpsError("invalid-argument", "taskId e status são obrigatórios.");
        }

        const taskRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("tasks")
            .doc(taskId);

        const taskSnap = await taskRef.get();
        if (!taskSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Tarefa não encontrada.");
        }
        const task = taskSnap.data();

        const updatePayload = {
            status,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (observations) updatePayload.observations = observations;
        if (status === 'canceled') updatePayload.canceledAt = FieldValue.serverTimestamp();

        await taskRef.update(updatePayload);

        // Auditoria
        try {
            const staffName = token?.name || token?.email || uid;
            await saveAuditLog({
                idTenant, idBranch, uid,
                userName: staffName,
                action: "TASK_UPDATE_STATUS",
                targetId: taskId,
                description: `Atualizou status da tarefa para: ${status}`,
                metadata: {
                    oldStatus: task.status,
                    newStatus: status,
                    observations: observations || ""
                }
            });
        } catch (auditError) {
            console.error("Falha auditoria status:", auditError);
        }

        return { success: true };
    } catch (e) {
        console.error("[updateTaskStatus] Erro:", e);
        throw e;
    }
});

const { sendWhatsAppMessageInternal } = require("../notifications/whatsapp");

/**
 * Cria uma nova tarefa com auditoria.
 */
exports.createTask = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
    const { description, dueDate, assignedStaffIds, assignedStaffNames, clientName, recurrence } = data; // recurrence = { enabled, frequency, endMode, endValue }

    if (!description || !dueDate) {
        throw new functions.https.HttpsError("invalid-argument", "Descrição e data são obrigatórios.");
    }

    const payload = {
        description: description || "",
        dueDate: dueDate,
        assignedStaffIds: assignedStaffIds || [],
        assignedStaffNames: assignedStaffNames || "",
        clientName: clientName || "", // Safe fallback
        createdBy: uid,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("tasks")
        .add(payload);

    // --- Tratamento de Recorrência ---
    if (recurrence && recurrence.enabled) {
        try {
            // Calcular próxima data (ou usar a fornecida)
            let nextDateIso;

            if (recurrence.startDate) {
                nextDateIso = recurrence.startDate;
            } else {
                const startDate = new Date(dueDate);
                let nextDate = new Date(startDate);

                // Lógica de incremento
                if (recurrence.frequency === 'daily') {
                    nextDate.setDate(nextDate.getDate() + 1);
                } else if (recurrence.frequency === 'yearly') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                } else {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                nextDateIso = nextDate.toISOString().split('T')[0];
            }

            const templatePayload = {
                description: description || "",
                baseDueDate: dueDate, // Data de referência inicial
                nextExecutionDate: nextDateIso,
                assignedStaffIds: assignedStaffIds || [],
                assignedStaffNames: assignedStaffNames || "",
                clientName: clientName || "",
                createdBy: uid,
                status: "active",
                createdAt: FieldValue.serverTimestamp(),

                recurrence: {
                    frequency: recurrence.frequency || 'monthly',
                    endMode: recurrence.endMode || 'occurrences', // Fallback
                    endValue: recurrence.endValue || null, // Safety against undefined
                    currentOccurrence: 1, // Já criamos a primeira agora
                    startDate: recurrence.startDate || null // Safety
                }
            };

            await db
                .collection("tenants")
                .doc(idTenant)
                .collection("branches")
                .doc(idBranch)
                .collection("recurringTaskTemplates")
                .add(templatePayload);

            console.log("Template de tarefa recorrente criado com sucesso.");
        } catch (recError) {
            console.error("Erro ao criar template de recorrência:", recError);
            // Não falhamos a tarefa original, apenas logamos o erro da recorrência
        }
    }

    // Auditoria
    try {
        const staffName = token?.name || token?.email || uid;
        // Prefer explicit clientName (linked student), then assigned staff names, then unassigned
        const targetNames = clientName || assignedStaffNames || 'unassigned';

        await saveAuditLog({
            idTenant, idBranch, uid,
            userName: staffName,
            action: "TASK_CREATE",
            targetId: docRef.id,
            description: `Criou nova tarefa: ${description}`,
            metadata: {
                description: description || "",
                dueDate: dueDate || "",
                assignedTo: assignedStaffIds || [],
                clientName: targetNames || "" // Shows in "Alvo" column
            }
        });
    } catch (auditError) {
        console.error("Falha silenciosa na auditoria de criação de tarefa:", auditError);
    }

    // --- Notificação WhatsApp para Staffs Selecionados ---
    if (Array.isArray(assignedStaffIds) && assignedStaffIds.length > 0) {
        console.log(`Iniciando notificações para ${assignedStaffIds.length} staffs. IDs:`, assignedStaffIds);
        try {
            const dateFormatted = new Date(dueDate).toLocaleDateString('pt-BR');
            const studentInfo = clientName ? ` (Vínculo: ${clientName})` : "";

            for (const staffId of assignedStaffIds) {
                const staffSnap = await db
                    .collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("staff")
                    .doc(staffId)
                    .get();

                if (staffSnap.exists) {
                    const staffData = staffSnap.data();
                    const phone = staffData.phone || staffData.whatsapp || staffData.mobile;

                    if (phone) {
                        const message = `🔔 *Nova Tarefa Atribuída*\n\nOlá ${staffData.firstName || 'colaborador'},\n\nUma nova tarefa foi atribuída a você no PGA:\n\n*Descrição:* ${description}${studentInfo}\n*Prazo:* ${dateFormatted}\n\nPor favor, verifique seu dashboard para mais detalhes.`;

                        console.log(`Enviando WhatsApp para staff ${staffId} no número ${phone}`);
                        await sendWhatsAppMessageInternal(idTenant, idBranch, phone, message, "evolution_financial")
                            .then(() => console.log(`WhatsApp enviado com sucesso para staff ${staffId}`))
                            .catch(err => console.error(`Erro ao enviar WhatsApp para staff ${staffId}:`, err.message));
                    } else {
                        console.log(`Staff ${staffId} não possui telefone cadastrado.`);
                    }
                } else {
                    console.log(`Documento do staff ${staffId} não encontrado em Firestore.`);
                }
            }
        } catch (notifErr) {
            console.error("Erro geral no gatilho de notificação de tarefa:", notifErr);
        }
    } else {
        console.log("Nenhum staff atribuído para notificação.");
    }

    return { id: docRef.id, ...payload };
});

/**
 * Marca um alerta operacional (aniversário ou vencimento) como concluído.
 */
exports.completeOperationalAlert = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
    const { alertId, type, description, targetName } = data;

    if (!alertId || !type) {
        throw new functions.https.HttpsError("invalid-argument", "alertId e type são obrigatórios.");
    }

    const completionRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("alertCompletions")
        .doc(alertId);

    const now = FieldValue.serverTimestamp();
    const today = new Date().toISOString().split('T')[0];

    await completionRef.set({
        type: type || "unknown",
        alertId: alertId || "",
        completedAt: now,
        completedBy: uid,
        completionDate: today,
        updatedAt: now
    });

    // Auditoria
    try {
        const staffName = token?.name || token?.email || uid;
        const action = type === 'birthday' ? 'BIRTHDAY_HANDLED' : 'EXPIRATION_HANDLED';

        await saveAuditLog({
            idTenant, idBranch, uid,
            userName: staffName,
            action,
            targetId: alertId,
            description: `Concluiu ${type === 'birthday' ? 'aniversário' : 'vencimento'}: ${description || alertId}`,
            metadata: {
                description: description || "",
                clientName: targetName || "",
                type: type || ""
            }
        });
    } catch (auditError) {
        console.error("Falha silenciosa na auditoria de conclusão de alerta:", auditError);
    }

    return { success: true };
});
