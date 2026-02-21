import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseBackend } from '../../helpers/firebase_helper';
import { DEFAULT_MODELS, AI_PROVIDERS } from './AIModels';

/**
 * Service to generate AI content.
 * SEGURANÇA: Delega a geração para uma Cloud Function. 
 * NUNCA injeta API Keys da OpenAI/Gemini diretamente no React.
 */
class AIService {
    constructor() {
        this.provider = 'openai'; // Fallback visual provider
    }

    get functions() {
        const backend = getFirebaseBackend();
        return getFunctions(backend.app);
    }

    /**
     * Gera texto delegando o payload para a Firebase Cloud Function
     * @param {string} prompt - O comando para a IA
     * @param {object} context - Dados adicionais para enriquecer o prompt
     * @param {object} options - Opções extras { provider, model, tenantId }
     */
    async generateText(prompt, context = {}, options = {}) {
        const provider = options.provider || this.provider;
        const model = options.model || DEFAULT_MODELS[provider] || DEFAULT_MODELS[AI_PROVIDERS.OPENAI];

        // Se o tenant salvar sua PROPRIA chave privada, enviar. 
        // Caso contrário a Cloud Function usará a chave Global dela (Seguro).
        const tenantApiKey = options.apiKey || null;

        try {
            console.log(`[AIService] Solicitando geração via Cloud Function (${model})`);
            const generateAiContent = httpsCallable(this.functions, 'generateAiContent');

            const result = await generateAiContent({
                prompt,
                context,
                provider,
                model,
                tenantApiKey // A function usará esta, e se nulo, usará a global do servidor
            });

            if (!result.data || !result.data.success) {
                throw new Error(result.data?.error || 'Erro desconhecido na Cloud Function de IA');
            }

            return result.data.text;
        } catch (error) {
            console.error(`[AIService] Erro de Servidor na IA:`, error);
            throw new Error(`Erro de IA via Servidor: ${error.message}`);
        }
    }
}

export const aiService = new AIService();
