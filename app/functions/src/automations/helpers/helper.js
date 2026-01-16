const admin = require("firebase-admin");
const db = admin.firestore();
// Adjust import path: previously it was ../notifications/whatsapp. 
// Now it is inside helpers/, so we need ../../notifications/whatsapp
const { sendWhatsAppMessageInternal } = require("../../notifications/whatsapp");

/**
 * Processar um Gatilho de Automação
 * @param {string} idTenant 
 * @param {string} idBranch 
 * @param {string} triggerType - Um de NEW_LEAD, EXPERIMENTAL_SCHEDULED, etc.
 * @param {object} data - Dados para substituir variáveis (name, date, time, etc.)
 */
exports.processTrigger = async (idTenant, idBranch, triggerType, data) => {

    try {
        const automationsRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("automations");

        // Buscar automações ativas para este tipo de gatilho
        const snapshot = await automationsRef
            .where("active", "==", true)
            .where("type", "==", triggerType)
            .get();

        if (snapshot.empty) {
            return;
        }

        // GARANTIA DE SINGLETON:
        // A UI permite configurar apenas UMA automação por tipo.
        // Se existirem duplicatas no DB, devemos processar apenas a primeira para evitar envio duplo.
        const automationDoc = snapshot.docs[0];
        const automation = automationDoc.data();
        let message = automation.whatsappTemplate;

        // Substituir Variáveis
        // Suportadas: {name}, {date}, {time}, {professional}, {activity}
        if (message) {
            message = message.replace(/{name}/g, data.name || "");
            message = message.replace(/{date}/g, data.date || "");
            message = message.replace(/{time}/g, data.time || "");
            message = message.replace(/{professional}/g, data.professional || "");
            message = message.replace(/{activity}/g, data.activity || "");
            message = message.replace(/{student}/g, data.student || data.name || "");
            message = message.replace(/{teacher}/g, data.teacher || data.professional || "");
            message = message.replace(/{results}/g, data.results || "");

            // Você pode adicionar mais variáveis aqui conforme necessário
        }

        if (data.phone && message) {
            await sendWhatsAppMessageInternal(idTenant, idBranch, data.phone, message);
            return true; // Sucesso
        }
        return false; // Sem telefone ou mensagem

    } catch (error) {
        console.error(`Error processing trigger ${triggerType}:`, error);
        return false; // Erro
    }
};
