const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Helper para atualizar o resumo mensal
 */
async function updateMonthlySummary(idTenant, idBranch, updates, overrideMonthId = null) {
    if (!idTenant || !idBranch) return;
    const monthId = overrideMonthId || new Date().toISOString().slice(0, 7);
    const monthlyRef = db
        .collection("tenants")
        .doc(String(idTenant))
        .collection("branches")
        .doc(String(idBranch))
        .collection("monthlySummary")
        .doc(monthId);

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updates.idTenant = String(idTenant);
    updates.idBranch = String(idBranch);
    updates.id = monthId;

    await monthlyRef.set(updates, { merge: true });
}

/**
 * Lógica para rastrear novos Leads e atualizar o funil
 */
async function handleNewLead(change, context) {
    const idTenant = context?.params?.idTenant;
    const idBranch = context?.params?.idBranch;

    const newData = change.after.exists ? change.after.data() : null;
    const oldData = change.before.exists ? change.before.data() : null;

    if (!newData) return null;

    // Lógica 1: É um Novo Lead?
    const isNewLead = !oldData && (newData.status || "").toLowerCase() === "lead";
    const becameLead = oldData && (oldData.status || "").toLowerCase() !== "lead" && (newData.status || "").toLowerCase() === "lead";

    if (isNewLead || becameLead) {
        // Atualizar Estado do Funil do Cliente
        const clientRef = change.after.ref;
        const funnel = newData.funnel || {};

        if (!funnel.isLead) {
            await clientRef.update({
                "funnel.isLead": true,
                "funnel.leadAt": admin.firestore.FieldValue.serverTimestamp()
            });
            // Incrementar Métrica
            await updateMonthlySummary(idTenant, idBranch, {
                leadsMonth: admin.firestore.FieldValue.increment(1)
            });
        }
    }
    return null;
}

/**
 * Lógica para rastrear agendamentos experimentais
 */
async function handleExperimentalScheduled(snap, context) {
    const idTenant = context?.params?.idTenant;
    const idBranch = context?.params?.idBranch;
    const data = snap.data() || {};

    if (data.type === 'experimental' || data.type === 'single-session') {
        const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(data.idClient);

        // Verificar Estado do Cliente
        const clientSnap = await clientRef.get();
        if (!clientSnap.exists) return null;
        const funnel = clientSnap.data().funnel || {};

        if (!funnel.scheduled) {
            await clientRef.update({
                "funnel.scheduled": true,
                "funnel.scheduledAt": admin.firestore.FieldValue.serverTimestamp()
            });
            await updateMonthlySummary(idTenant, idBranch, {
                experimental_scheduled: admin.firestore.FieldValue.increment(1)
            });
        }
    }
    return null;
}

/**
 * Lógica para rastrear conversões (Vendas)
 */
async function handleConversion(snap, context) {
    const idTenant = context?.params?.idTenant;
    const idBranch = context?.params?.idBranch;
    const data = snap.data() || {};

    const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(data.idClient);

    const clientSnap = await clientRef.get();
    if (!clientSnap.exists) return null;
    const funnel = clientSnap.data().funnel || {};

    // Só computa conversão SE o cliente entrou no funil como Lead alguma vez.
    // Isso evita que renovações de alunos antigos (sem histórico de funil atual) contem como conversão.
    if ((funnel.isLead || funnel.leadAt) && !funnel.converted) {
        await clientRef.update({
            "funnel.converted": true,
            "funnel.convertedAt": admin.firestore.FieldValue.serverTimestamp()
        });
        await updateMonthlySummary(idTenant, idBranch, {
            conversions: admin.firestore.FieldValue.increment(1)
        });
    }
    return null;
}

/**
 * Lógica para rastrear presença em aulas experimentais
 */
async function handleExperimentalAttendance(change, context) {
    const idTenant = context?.params?.idTenant;
    const idBranch = context?.params?.idBranch;
    const idClient = context?.params?.idClient;

    const newData = change.after.exists ? change.after.data() : null;
    if (!newData) return null;

    const isPresent = (newData.status || "").toLowerCase() === 'present';
    const isExperimental = (newData.type || "").toLowerCase() === 'experimental' || (newData.type || "").toLowerCase() === 'single-session';

    if (isPresent && isExperimental) {
        const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient);
        const clientSnap = await clientRef.get();
        if (!clientSnap.exists) return null;
        const funnel = clientSnap.data().funnel || {};

        if (!funnel.attended) {
            await clientRef.update({
                "funnel.attended": true,
                "funnel.attendedAt": admin.firestore.FieldValue.serverTimestamp()
            });
            await updateMonthlySummary(idTenant, idBranch, {
                attended: admin.firestore.FieldValue.increment(1)
            });
        }
    }
    return null;
}

/**
 * Lógica para rastrear remoção de agendamentos experimentais
 * Se o usuário deletar TODOS os agendamentos experimentais, reverte o status "Scheduled" e decrementa o resumo.
 */
async function handleExperimentalDeletion(snap, context) {
    const idTenant = context?.params?.idTenant;
    const idBranch = context?.params?.idBranch;
    const data = snap.data() || {};

    if (data.type === 'experimental' || data.type === 'single-session') {
        const idClient = data.idClient;
        if (!idClient) return null;

        // Verifica se o cliente tem QUALQUER outro agendamento experimental ativo
        const othersSnap = await db.collection("tenants").doc(idTenant)
            .collection("branches").doc(idBranch)
            .collection("enrollments")
            .where("idClient", "==", idClient)
            .where("type", "in", ["experimental", "single-session"])
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (!othersSnap.empty) {
            // Ainda tem aulas experimentais, NÃO decrementa o funil
            return null;
        }

        // Cliente NÃO tem mais aulas experimentais. Reverte o Estado do Funil.
        const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient);
        const clientSnap = await clientRef.get();
        if (!clientSnap.exists) return null;

        const funnel = clientSnap.data().funnel || {};

        // Só decrementa se eles foram contados como Agendados
        if (funnel.scheduled) {
            // Determina qual mês decrementar
            // Usa a data scheduledAt para encontrar o mês
            let monthId = null;
            if (funnel.scheduledAt && funnel.scheduledAt.toDate) {
                monthId = funnel.scheduledAt.toDate().toISOString().slice(0, 7);
            } else {
                // Fallback para o mês atual se a data estiver faltando (raro)
                monthId = new Date().toISOString().slice(0, 7);
            }

            await clientRef.update({
                "funnel.scheduled": false,
                "funnel.scheduledAt": null
            });

            await updateMonthlySummary(idTenant, idBranch, {
                experimental_scheduled: admin.firestore.FieldValue.increment(-1)
            }, monthId);
        }
    }
    return null;
}

module.exports = {
    updateMonthlySummary,
    handleNewLead,
    handleExperimentalScheduled,
    handleConversion,
    handleExperimentalAttendance,
    handleExperimentalDeletion
};
