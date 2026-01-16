const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { requireAuthContext } = require("../shared/context");
const { saveAuditLog } = require("../shared/audit");

const db = admin.firestore();

/**
 * Marca uma tarefa como concluída e gera log de auditoria.
 */
exports.completeTask = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
    const { taskId, clientName: uiClientName } = data; // uiClientName if we want to pass it from UI

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
        throw new functions.https.HttpsError("not-found", "Tarefa não encontrada.");
    }

    const task = taskSnap.data();

    await taskRef.update({
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedBy: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Auditoria
    try {
        const staffName = token?.name || token?.email || uid;
        // Prefer stored clientName (linked student), then UI passed, then assigned staff, then unassigned
        const targetNames = task.clientName || uiClientName || task.assignedStaffNames || 'unassigned';

        await saveAuditLog({
            idTenant, idBranch, uid,
            userName: staffName,
            action: "TASK_COMPLETE",
            targetId: taskId,
            description: `Concluiu tarefa: ${task.description || taskId}`,
            metadata: {
                description: task.description,
                clientName: targetNames // Shows in "Alvo" column
            }
        });
    } catch (auditError) {
        console.error("Falha silenciosa na auditoria de conclusão de tarefa:", auditError);
    }

    return { success: true };
});

const { sendWhatsAppMessageInternal } = require("../notifications/whatsapp");

/**
 * Cria uma nova tarefa com auditoria.
 */
exports.createTask = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
    const { description, dueDate, assignedStaffIds, assignedStaffNames, clientName } = data; // clientName passed from FE if student linked

    if (!description || !dueDate) {
        throw new functions.https.HttpsError("invalid-argument", "Descrição e data são obrigatórios.");
    }

    const payload = {
        description,
        dueDate,
        assignedStaffIds: assignedStaffIds || [],
        assignedStaffNames: assignedStaffNames || "",
        createdBy: uid,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("tasks")
        .add(payload);

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
                description,
                dueDate,
                assignedTo: assignedStaffIds,
                clientName: targetNames // Shows in "Alvo" column
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
                        const message = `🔔 *Nova Tarefa Atribuída*\n\nOlá ${staffData.firstName || 'colaborador'},\n\nUma nova tarefa foi atribuída a você no Painel Swim:\n\n*Descrição:* ${description}${studentInfo}\n*Prazo:* ${dateFormatted}\n\nPor favor, verifique seu dashboard para mais detalhes.`;

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
