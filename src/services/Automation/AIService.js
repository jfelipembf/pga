import axios from 'axios';

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
        const apiKey = options.apiKey || this.apiKey;
        const provider = options.provider || this.provider;
        const model = options.model || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash');

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
        // Implementação básica do Gemini REST API
        // Se o model vier vazio, garantir um default válido
        const finalModel = model || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: prompt }]
            }]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data.candidates[0].content.parts[0].text;
    }
}

export const aiService = new AIService();
