import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseBackend } from '../../helpers/firebase_helper';

/**
 * Service to handle WhatsApp interactions via Evolution API
 * SEGURANÇA: Delega o envio de mensagem para uma Cloud Function. 
 * NUNCA injeta a API Key Evolution diretamente no React.
 */
class MessagingService {
    constructor() {
        // Fallback apenas para referência, não usado pra requests no front
        this.baseUrl = process.env.REACT_APP_EVOLUTION_API_URL || 'https://api.evolution.com';
    }

    get functions() {
        const backend = getFirebaseBackend();
        return getFunctions(backend.app);
    }

    /**
     * Check connection state of the instance
     * Delega para o servidor testar a conexão
     */
    async getConnectionState(customConfig) {
        try {
            const checkWhatsAppConnection = httpsCallable(this.functions, 'checkWhatsAppConnection');
            const result = await checkWhatsAppConnection({ customConfig });

            if (!result.data || !result.data.success) {
                return { success: false, error: result.data?.error || 'Erro ao checar conexão' };
            }

            return { success: true, data: result.data.info };
        } catch (error) {
            console.error('[MessagingService] Error checking status via Server:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send a plain text message
     * Delega para o servidor enviar a mensagem
     */
    async sendText(tenantId, phone, message, customConfig = null) {
        try {
            // Formatar telefone (Brasil default)
            const cleanPhone = phone.replace(/\D/g, '');
            let formattedPhone = cleanPhone;

            if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
                formattedPhone = `55${cleanPhone}`;
            }

            const sendWhatsAppMessage = httpsCallable(this.functions, 'sendWhatsAppMessage');

            const result = await sendWhatsAppMessage({
                tenantId,
                phone: formattedPhone,
                message,
                customConfig // Se a academia tem chave propria, o back usa, senão, o back usa a global local
            });

            if (!result.data || !result.data.success) {
                return { success: false, error: result.data?.error || 'Erro ao enviar via Cloud Function' };
            }

            return { success: true, data: result.data.response };

        } catch (error) {
            console.error('[MessagingService] Error sending text via Server:', error);
            return { success: false, error: error.message };
        }
    }
}

export const messagingService = new MessagingService();
