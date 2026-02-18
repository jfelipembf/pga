import axios from 'axios';
import { DEFAULT_MODELS, AI_PROVIDERS } from './AIModels';

/**
 * Service to generate AI content using OpenAI or Google Gemini
 */
class AIService {
    constructor() {
        this.provider = process.env.REACT_APP_AI_PROVIDER || 'openai'; // 'openai' | 'gemini'
        this.apiKey = process.env.REACT_APP_AI_API_KEY;
    }

    /**
     * Gera texto com base em um prompt e contexto
     * @param {string} prompt - O comando para a IA
     * @param {object} context - Dados adicionais para enriquecer o prompt
     * @param {object} options - Opções extras { apiKey, provider, model }
     */
    async generateText(prompt, context = {}, options = {}) {
        let apiKey = options.apiKey || this.apiKey;
        const provider = options.provider || this.provider;
        const model = options.model || DEFAULT_MODELS[provider] || DEFAULT_MODELS[AI_PROVIDERS.OPENAI];

        // Remover espaços acidentais da chave
        if (apiKey) apiKey = apiKey.toString().trim();

        if (!apiKey) {
            console.error('[AIService] API Key not configured');
            return null;
        }

        const enrichedPrompt = this._enrichPrompt(prompt, context);

        try {
            if (provider === 'openai') {
                return await this._callOpenAI(enrichedPrompt, model, apiKey);
            } else if (provider === 'gemini') {
                return await this._callGemini(enrichedPrompt, model, apiKey);
            }
        } catch (error) {
            console.error(`[AIService] Error calling ${provider}:`, error);
            throw error;
        }
    }

    _enrichPrompt(prompt, context) {
        // Simples injeção de contexto no rodapé do prompt
        // Em um sistema real, usaria templates mais robustos
        if (!context || Object.keys(context).length === 0) return prompt;

        const contextStr = JSON.stringify(context, null, 2);
        return `${prompt}\n\n[Contexto do Aluno/Situação]:\n${contextStr}`;
    }

    async _callOpenAI(prompt, model, apiKey) {
        const url = 'https://api.openai.com/v1/chat/completions';

        const response = await axios.post(url, {
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    async _callGemini(prompt, model, apiKey) {
        // v1beta é necessário para modelos recentes via Google AI Studio
        let finalModel = model || DEFAULT_MODELS[AI_PROVIDERS.GEMINI];

        // Validar modelo — fallback para gemini-2.5-flash se o modelo salvo for inválido
        const VALID = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        if (!VALID.includes(finalModel)) {
            console.warn(`[AIService] Modelo '${finalModel}' não reconhecido.Usando gemini-2.5-flash.`);
            finalModel = 'gemini-2.5-flash';
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`;

        console.log(`[AIService] Chamando Gemini: ${finalModel}`);

        try {
            const response = await axios.post(url, {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096, // Aumento para modelos v3
                }
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
                throw new Error("A IA retornou uma resposta vazia.");
            }

            return response.data.candidates[0].content.parts[0].text;
        } catch (error) {
            const errorData = error.response?.data;
            console.error(`[AIService] Erro Gemini:`, errorData || error.message);

            if (error.response?.status === 404) {
                throw new Error(`Erro 404: O modelo '${finalModel}' não foi encontrado. Em 2026, modelos Pro/Flash antigos podem ter sido desativados. Verifique se o modelo selecionado é o Gemini 3.0 Flash.`);
            }

            const msg = errorData?.error?.message || error.message;
            throw new Error(`Erro na IA: ${msg}`);
        }
    }
}

export const aiService = new AIService();
