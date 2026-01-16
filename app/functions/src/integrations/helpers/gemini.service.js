const axios = require("axios");

/**
 * Analisa um texto ou imagem usando o Google Gemini para extrair dados de despesa.
 * 
 * @param {string} apiKey - Chave da API do Google Gemini.
 * @param {string} text - Texto da mensagem (opcional).
 * @param {string} imageBase64 - Base64 da imagem (opcional).
 * @param {string} mimeType - Tipo MIME da imagem (ex: 'image/jpeg').
 * @returns {Promise<object>} - Retorna o objeto JSON da despesa ou null se falhar.
 */
const analyzeExpense = async (apiKey, text = "", imageBase64 = null, mimeType = "image/jpeg") => {
    if (!apiKey) {
        console.error("GeminiService: API Key não fornecida.");
        return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const prompt = `
    Você é um assistente financeiro pessoal. Analise a seguinte mensagem (texto ou imagem de recibo) e extraia os dados da despesa.
    Retorne APENAS um JSON válido (sem markdown, sem aspas triplas) com o seguinte formato:
    {
        "amount": number (valor em reais, ex: 50.00),
        "description": string (descrição curta, ex: "Almoço"),
        "category": string (Escolha OBRIGATORIAMENTE uma destas: "Infraestrutura", "Manutenção", "Recursos Humanos" (Salários, 13º, Férias), "Marketing", "Equipamentos", "Operacional", "Impostos", "Reembolso", "Indefinido"),
        "warning": string (opcional. Se estiver inseguro ou faltar informação, explique aqui o motivo. Ex: "Não citou o motivo do gasto")
        "date": string (data da despesa no formato YYYY-MM-DD. A DATA DE HOJE É: ${new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}. Se o usuário não disser o ano, assuma o ano ATUAL: ${new Date().getFullYear()})
    }
    Se não conseguir entender ou não for uma despesa, retorne: { "error": "Não entendi" }
    `;

    const parts = [
        { text: prompt }
    ];

    if (text) {
        parts.push({ text: `Mensagem do usuário: "${text}"` });
    }

    if (imageBase64) {
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: imageBase64
            }
        });
    }

    try {

        const response = await axios.post(endpoint, {
            contents: [{ parts: parts }]
        });



        const candidates = response.data?.candidates;
        if (candidates && candidates.length > 0) {
            let content = candidates[0].content.parts[0].text;


            // Limpa markdown se houver (```json ... ```)
            content = content.replace(/```json/g, "").replace(/```/g, "").trim();

            return JSON.parse(content);
        }

        console.warn("[DEBUG] Gemini: Nenhum candidato retornado.");
        return null;
    } catch (error) {
        console.error("GeminiService: Erro ao analisar despesa.", error.response?.data || error.message);
        return null;
    }
};

module.exports = {
    analyzeExpense
};
