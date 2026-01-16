const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { analyzeExpense } = require("../helpers/gemini.service");
const { sendWhatsAppMessageInternal } = require("../../notifications/whatsapp");
const { generateEntityId } = require("../../shared/id");
const { fetchBase64FromMessage } = require("../helpers/evolution.service");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Webhook para receber mensagens do Robô Financeiro (Evolution API).
 * Otimizado para eficiência, segurança e tratamento centralizado de mídia.
 */
exports.financialWebhook = functions.region("us-central1").https.onRequest(async (req, res) => {
    // 1. Validar Método
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const { idTenant, idBranch } = req.query;
    if (!idTenant || !idBranch) return res.status(400).send("Missing idTenant or idBranch");

    const data = req.body.data;

    // Objeto de credenciais dinâmico (prioridade para Config do Banco, mas inicializa com Payload)
    const evoCredentials = {
        url: req.body.server_url,
        key: req.body.apikey,
        instance: req.body.instance
    };

    // 2. Validação Básica de Payload
    if (!data || !data.key || !data.message) {
        return res.status(200).send("Ignored (Invalid Payload)");
    }

    try {
        // 3. Extração Centralizada de Conteúdo (Texto e Mídia)
        // Helper interno para evitar duplicação de lógica entre Imagem e Áudio e Chamadas de API
        const content = await extractMessageContent(data, evoCredentials);

        // Se não tiver conteúdo processável (ex: sticker, vídeo sem legenda, etc)
        if (!content.text && !content.base64) {
            return res.status(200).send("Ignored (No Content)");
        }

        // 4. Proteção contra Loop (Bot falando com ele mesmo)
        // Permite "Note to Self" (fromMe: true), mas bloqueia mensagens iniciadas pelo Bot via API
        const botPrefixes = ["✅", "⚠️", "❌", "🤖", "🤔", "❓"];
        if (content.text && botPrefixes.some(p => content.text.startsWith(p))) {
            return res.status(200).send("Ignored (Bot Loop detected)");
        }

        // 5. Configuração e Segurança (Whitelist)
        const configRef = db.collection("tenants").doc(idTenant)
            .collection("branches").doc(idBranch)
            .collection("integrations").doc("evolution_financial");

        const configSnap = await configRef.get();
        if (!configSnap.exists) {
            console.warn(`FinancialWebhook: Integracao nao configurada para ${idTenant}/${idBranch}`);
            return res.status(200).send("Config not found");
        }

        const config = configSnap.data();
        const allowedNumber = config.allowedNumber ? config.allowedNumber.replace(/\D/g, "") : null;
        const sender = data.key.remoteJid.replace(/\D/g, "");

        if (!allowedNumber || !sender.includes(allowedNumber)) {
            console.warn(`FinancialWebhook: Blocked sender ${sender} (Allowed: ${allowedNumber})`);
            return res.status(200).send("Unauthorized Sender");
        }

        // Atualizar credenciais com as do banco (Prioridade para URL Pública do Banco)
        if (config.baseUrl) evoCredentials.url = config.baseUrl;
        if (config.apiKey) evoCredentials.key = config.apiKey;
        if (config.instanceName) evoCredentials.instance = config.instanceName;

        // Se houver mídia na mensagem mas falhou o download (API da Evolution offline ou URL interna)
        if (content.hasMediaButFailed) {
            await sendWhatsAppMessageInternal(idTenant, idBranch, sender, "⚠️ Falha ao baixar a mídia/áudio. Verifique a conexão da instância.", "evolution_financial");
            return res.status(200).send("Media Retrieval Failed");
        }

        // 6. Fluxo de Confirmação (Sim/Ok)
        const cleanText = content.text ? content.text.trim().toLowerCase() : "";
        const isConfirmation = ["sim", "ok", "confirmar", "tá certo", "pode", "yes", "confirmado"].includes(cleanText);

        if (isConfirmation) {
            const pendingQuery = await db.collection("tenants").doc(idTenant)
                .collection("branches").doc(idBranch)
                .collection("financialTransactions")
                .where("source", "==", "whatsapp_bot")
                .where("status", "==", "pending")
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();

            if (!pendingQuery.empty) {
                // Confirma a última despesa pendente
                await pendingQuery.docs[0].ref.update({
                    status: "paid",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                await sendWhatsAppMessageInternal(idTenant, idBranch, sender, "✅ *Confirmado!* Despesa lançada.", "evolution_financial");
                return res.status(200).send("Expense Confirmed");
            } else {
                await sendWhatsAppMessageInternal(idTenant, idBranch, sender, "❓ Nenhuma despesa pendente encontrada.", "evolution_financial");
                return res.status(200).send("No pending expense");
            }
        }

        // 7. Fluxo de Análise de Nova Despesa (Gemini)
        if (!config.geminiApiKey) {
            await sendWhatsAppMessageInternal(idTenant, idBranch, sender, "⚠️ Configure a API Key do Gemini no painel.", "evolution_financial");
            return res.status(200).send("Missing Gemini Key");
        }

        // Análise Inteligente (Texto + Base64 se houver)
        const expenseData = await analyzeExpense(config.geminiApiKey, content.text, content.base64, content.mimeType);

        if (!expenseData || expenseData.error) {
            await sendWhatsAppMessageInternal(idTenant, idBranch, sender, "🤖 Não entendi. Tente descrever: 'Almoço 50 reais'.", "evolution_financial");
            return res.status(200).send("AI Parsing Failed");
        }

        // 8. Salvar no Firestore (Status: Pending)
        const transactionId = await generateEntityId(idTenant, idBranch, "transaction", { sequential: true });

        const expensePayload = {
            idTransaction: transactionId,
            transactionCode: transactionId,
            type: "expense",
            description: expenseData.description || "Despesa WhatsApp",
            amount: Number(expenseData.amount) || 0,
            category: expenseData.category || "Outros",
            date: expenseData.date || new Date().toLocaleDateString("en-CA"),
            method: "outros",
            status: "pending",
            source: "whatsapp_bot",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "bot",
            // Helper para auditoria
            metadata: {
                senderNumber: sender,
                senderName: data.pushName || "WhatsApp"
            }
        };

        await db.collection("tenants").doc(idTenant)
            .collection("branches").doc(idBranch)
            .collection("financialTransactions").doc(transactionId).set(expensePayload);

        // 9. Solicitar Confirmação ao Usuário
        let msg = `🤔 *Confirma?*\n\n📝 ${expensePayload.description}\n💰 R$ ${expensePayload.amount.toFixed(2)}\n📂 ${expensePayload.category}\n📅 ${expensePayload.date}`;
        if (expenseData.warning) msg += `\n⚠️ ${expenseData.warning}`;
        msg += `\n\nResponda *Sim* para confirmar.`;

        await sendWhatsAppMessageInternal(idTenant, idBranch, sender, msg, "evolution_financial");
        return res.status(200).send("Pending Confirmation");

    } catch (error) {
        console.error("FinancialWebhook Error:", error);
        // Em caso de erro crítico, avisa o usuário (opcional, bom para UX)
        try {
            // Tenta extrair sender de novo caso tenha falhado antes
            const fallbackSender = data.key?.remoteJid?.replace(/\D/g, "");
            if (fallbackSender) {
                await sendWhatsAppMessageInternal(idTenant, idBranch, fallbackSender, "❌ Erro interno no processamento.", "evolution_financial");
            }
        } catch (e) { /* ignore */ }

        return res.status(500).send("Internal Error");
    }
});

/**
 * Função Helper para extrair texto e mídia de forma unificada.
 * Resolve a complexidade de buscar Base64 (Direto vs API) para Imagem e Áudio.
 */
async function extractMessageContent(data, credentials) {
    const msg = data.message;
    let text = "";
    let base64 = null;
    let mimeType = "image/jpeg"; // Default safe
    let hasMediaButFailed = false;

    // 1. Extração de Texto
    if (msg.conversation) {
        text = msg.conversation;
    } else if (msg.extendedTextMessage && msg.extendedTextMessage.text) {
        text = msg.extendedTextMessage.text;
    }

    // 2. Extração de Mídia (Imagem ou Áudio)
    const mediaMsg = msg.imageMessage || msg.audioMessage;

    if (mediaMsg) {
        // Se for imagem e tiver legenda, usa como texto principal (sobrescreve vazio)
        if (msg.imageMessage?.caption) text = msg.imageMessage.caption;

        mimeType = mediaMsg.mimetype || (msg.imageMessage ? "image/jpeg" : "audio/mp3");

        // Prioridade A: Base64 direto no payload (Mais rápido e barato)
        if (mediaMsg.base64) {
            base64 = mediaMsg.base64;
        }
        // Prioridade B: Buscar via API da Evolution (Se URL existir mas Base64 não)
        else if (mediaMsg.url && credentials.url && credentials.key) {
            try {
                // fetchBase64FromMessage lida com a chamada correta para a API
                // Passamos 'data' completo pois a API pode precisar de context info
                base64 = await fetchBase64FromMessage(credentials.url, credentials.key, credentials.instance, data);
            } catch (e) {
                console.error("Media Fetch Error:", e.message);
            }
        }

        // Limpeza e Validação Final do Base64
        if (base64) {
            // Remove prefixos "data:image/..." que a Gemini não aceita
            base64 = base64.replace(/^data:(image|audio|application)\/[a-z0-9]+;base64,/, "");
        } else {
            // Se tinha mensagem de mídia mas não conseguimos base64 nenhum
            hasMediaButFailed = true;
        }
    }

    return { text, base64, mimeType, hasMediaButFailed };
}
