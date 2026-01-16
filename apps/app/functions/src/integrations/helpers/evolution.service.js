const axios = require("axios");

/**
 * Cria ou verifica a existência de uma instância na Evolution API.
 * 
 * @param {string} baseUrl - URL base da API Evolution (ex: https://api.meudominio.com).
 * @param {string} apiKey - Chave de autenticação global da Evolution API.
 * @param {string} instanceName - Nome da instância a ser criada/verificada.
 * @returns {Promise<void>} - Retorna void em sucesso ou loga apenas o erro sem interromper o fluxo crítico.
 */
const ensureEvolutionInstance = async (baseUrl, apiKey, instanceName) => {
    if (!baseUrl || !apiKey || !instanceName) {
        console.warn("EvolutionService: Dados insuficientes para criar instância.");
        return;
    }

    try {
        const cleanUrl = baseUrl.replace(/\/$/, "");
        const createUrl = `${cleanUrl}/instance/create`;

        const createPayload = {
            instanceName: instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        };

        await axios.post(createUrl, createPayload, {
            headers: {
                apikey: apiKey,
                "Content-Type": "application/json"
            }
        });


    } catch (error) {
        // Loga aviso se falhar (ex: já existe), mas não impede o salvamento da config
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.warn(`EvolutionService: Aviso ao criar instância '${instanceName}':`, errorMsg);
    }
};

/**
 * Busca o Base64 de uma mensagem de mídia na Evolution API.
 * Endpoint: /chat/getBase64FromMediaMessage/{instance}
 */
const fetchBase64FromMessage = async (baseUrl, apiKey, instanceName, messageData) => {
    if (!baseUrl || !apiKey || !instanceName || !messageData) {
        throw new Error("Missing params for fetchBase64FromMessage");
    }

    const cleanUrl = baseUrl.replace(/\/$/, "");
    const url = `${cleanUrl}/chat/getBase64FromMediaMessage/${instanceName}`;

    const payload = {
        message: messageData, // O objeto message completo (ex: { imageMessage: ... })
        convertToMp4: false
    };

    const maxRetries = 3;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    apikey: apiKey,
                    "Content-Type": "application/json"
                },
                timeout: 15000 // 15s timeout
            });

            // Retorno esperado: { base64: "..." }
            return response.data?.base64;

        } catch (error) {
            lastError = error;
            attempt++;
            const isDnsError = error.code === 'EAI_AGAIN' || error.message.includes('EAI_AGAIN');

            if (isDnsError && attempt < maxRetries) {
                console.warn(`EvolutionService: Retry ${attempt}/${maxRetries} for fetchBase64 due to DNS error.`);
                await new Promise(res => setTimeout(res, 2000)); // Wait 2s
            } else if (attempt < maxRetries && error.response && error.response.status >= 500) {
                // Retry on server errors too
                console.warn(`EvolutionService: Retry ${attempt}/${maxRetries} for fetchBase64 due to 5xx error.`);
                await new Promise(res => setTimeout(res, 2000));
            } else {
                // If 4xx or other error, break immediately (unless it's a flaky 429?)
                // For now, let's keep retrying only on network/DNS or 500.
                if (!isDnsError && (!error.response || error.response.status < 500)) {
                    throw error;
                }
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }

    throw lastError;
};

module.exports = {
    ensureEvolutionInstance,
    fetchBase64FromMessage
};
