const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Busca dados básicos do aluno (nome e telefone)
 * @param {string} idTenant
 * @param {string} idBranch
 * @param {string} idClient
 */
async function getClientData(idTenant, idBranch, idClient) {
    const clientRef = db.collection("tenants").doc(idTenant)
        .collection("branches").doc(idBranch)
        .collection("clients").doc(idClient);

    const clientSnap = await clientRef.get();
    if (!clientSnap.exists) {
        return { name: "Aluno", firstName: "Aluno", phone: "" };
    }

    const data = clientSnap.data();
    const fullName = data.name || "Aluno";
    const firstName = fullName.split(" ")[0];
    const phone = data.phone || data.mobile || "";

    return { name: fullName, firstName, phone };
}

/**
 * Formata o texto de resultados da avaliação para envio via WhatsApp/Automação
 * @param {object} levelsByTopicId - Mapa de níveis por tópico
 */
function formatEvaluationResults(levelsByTopicId) {
    const entries = Object.values(levelsByTopicId || {});

    if (entries.length === 0) return null;

    // Ordenar por ordem do objetivo e depois ordem do tópico
    entries.sort((a, b) => {
        if ((a.objectiveOrder || 0) !== (b.objectiveOrder || 0)) {
            return (a.objectiveOrder || 0) - (b.objectiveOrder || 0);
        }
        return (a.topicOrder || 0) - (b.topicOrder || 0);
    });

    // Agrupar por Objetivo
    const grouped = {};
    entries.forEach(entry => {
        // Filtrar "Não avaliado" ou inválidos
        if (!entry.levelName || entry.levelName === "Não avaliado") return;

        const objName = entry.objectiveName || "Geral";
        if (!grouped[objName]) grouped[objName] = [];
        grouped[objName].push(entry);
    });

    let resultsText = "";
    let isFirst = true;

    for (const [objName, topics] of Object.entries(grouped)) {
        if (topics.length === 0) continue;

        if (!isFirst) {
            resultsText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        }
        isFirst = false;

        resultsText += `🏊 *${objName}*\n\n`;
        topics.forEach(t => {
            resultsText += `🔹 ${t.topicName}\n   ⭐ *${t.levelName}*\n\n`;
        });
    }

    return resultsText.trim() || null;
}

module.exports = {
    getClientData,
    formatEvaluationResults
};
