import axios from 'axios';

/**
 * Service to handle WhatsApp interactions via Evolution API
 */
class MessagingService {
    constructor() {
        // Idealmente, estas configs viriam do Tenant Settings no banco de dados
        // Para MVP, estamos lendo de variáveis de ambiente ou configs locais
        this.baseUrl = process.env.REACT_APP_EVOLUTION_API_URL || 'https://api.evolution.com';
        this.apiKey = process.env.REACT_APP_EVOLUTION_API_KEY;
    }

    /**
     * Get instance config for the current tenant
     * Em um cenário multi-tenant, cada academia pode ter sua instância
     */
    getInstanceConfig(tenantId) {
        // Simulação: buscar do banco ou usar padrão
        return {
            instanceName: `tenant_${tenantId}`, // ex: tenant_academia_x
            token: this.apiKey
        };
    }

    /**
     * Send a plain text message
     * @param {string} tenantId - Tenant identifier
     * @param {string} phone - Target phone number (E.164 format preferably)
     * @param {string} message - Message content
     */
    async sendText(tenantId, phone, message, customConfig = null) {
        try {
            const config = customConfig ? {
                instanceName: customConfig.evolutionInstanceName || customConfig.instanceName,
                token: customConfig.evolutionInstanceToken || customConfig.evolutionKey || customConfig.apiKey, // Tenta token da instancia ou chave global
                baseUrl: customConfig.evolutionUrl || this.baseUrl
            } : this.getInstanceConfig(tenantId);

            // Se customConfig tiver baseUrl, usa, senão usa do this.
            let baseUrl = (customConfig?.evolutionUrl || this.baseUrl).trim();
            if (!baseUrl.startsWith('http')) {
                baseUrl = `https://${baseUrl}`;
            }
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
            }

            // Formatar telefone (remover + e caracteres especiais)
            const cleanPhone = phone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

            const url = `${baseUrl}/message/sendText/${config.instanceName}`;

            const payload = {
                number: formattedPhone,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: false
                },
                textMessage: {
                    text: message
                }
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
            const errorDetails = error.response?.data || error.message;
            console.error('[MessagingService] Details:', errorDetails);
            return { success: false, error: errorDetails };
        }
    }

    /**
     * Send structured content (useful for templates and buttons if supported)
     */
    async sendTemplate(tenantId, phone, templateName, variables) {
        // Placeholder para envio de template
    }
}

export const messagingService = new MessagingService();
