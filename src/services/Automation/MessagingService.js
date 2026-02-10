import axios from 'axios';

/**
 * Service to handle WhatsApp interactions via Evolution API
 */
class MessagingService {
    constructor() {
        this.baseUrl = process.env.REACT_APP_EVOLUTION_API_URL || 'https://api.evolution.com';
        this.apiKey = process.env.REACT_APP_EVOLUTION_API_KEY;
    }

    _normalizeUrl(url) {
        if (!url) return '';
        let normalized = url.trim();
        if (!normalized.startsWith('http')) {
            normalized = `https://${normalized}`;
        }
        if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        return normalized;
    }

    _getConfig(tenantId, customConfig) {
        if (customConfig) {
            return {
                instanceName: customConfig.evolutionInstanceName || customConfig.instanceName,
                token: customConfig.evolutionInstanceToken || customConfig.evolutionKey || customConfig.apiKey,
                baseUrl: this._normalizeUrl(customConfig.evolutionUrl || this.baseUrl)
            };
        }
        return {
            instanceName: `tenant_${tenantId}`,
            token: this.apiKey, // Padrão usa chave global ou env
            baseUrl: this._normalizeUrl(this.baseUrl)
        };
    }

    /**
     * Check connection state of the instance
     */
    async getConnectionState(customConfig) {
        const config = this._getConfig(null, customConfig);
        const url = `${config.baseUrl}/instance/connectionState/${config.instanceName}`;

        try {
            const response = await axios.get(url, {
                headers: { 'apikey': config.token }
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('[MessagingService] Error checking status:', error);
            const errorDetails = error.response?.data || error.message;
            return { success: false, error: errorDetails };
        }
    }

    /**
     * Send a plain text message
     */
    async sendText(tenantId, phone, message, customConfig = null) {
        let config = null;
        try {
            config = this._getConfig(tenantId, customConfig);

            // Formatar telefone (Brasil default)
            // Formatar telefone (Brasil default)
            const cleanPhone = phone.replace(/\D/g, '');
            let formattedPhone = cleanPhone;

            // Se for número brasileiro (ou parecer), garantir 55
            // Verifica se não começa com 55 e tem 10 ou 11 dígitos (DDD + Número)
            if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
                formattedPhone = `55${cleanPhone}`;
            }
            // Se já tiver 12 ou 13 dígitos e começar com 55, mantém. 
            // Se for menor que 10, provavelmente invalido ou incompleto, mantém original (fallback)

            const url = `${config.baseUrl}/message/sendText/${config.instanceName}`;

            const payload = {
                number: formattedPhone,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: false
                },
                text: message
            };



            const response = await axios.post(url, payload, {
                headers: {
                    'apikey': config.token,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, data: response.data };

        } catch (error) {
            console.error('[MessagingService] Error sending text:', error);
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            console.error('[MessagingService] Connection Details:', {
                url: `${config?.baseUrl}/message/sendText/${config?.instanceName}`,
                instance: config?.instanceName,
                hasToken: !!config?.token
            });
            return { success: false, error: errorDetails };
        }
    }
}

export const messagingService = new MessagingService();
