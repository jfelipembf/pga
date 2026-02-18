/**
 * Centralized AI Models Configuration
 * Modelos verificados via ListModels API - Fevereiro 2026
 */

export const AI_PROVIDERS = {
    OPENAI: 'openai',
    GEMINI: 'gemini'
};

export const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o (Alta Performance e Visão)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Velocidade e Eficiência)' },
    { value: 'o1-preview', label: 'o1-preview (Raciocínio Lógico Complexo)' },
    { value: 'o1-mini', label: 'o1-mini (Raciocínio Rápido)' },
];

// Modelos verificados diretamente na API do Google AI Studio (Fev/2026)
export const GEMINI_MODELS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recomendado - Rápido e Inteligente)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Máxima Inteligência)' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (Próxima Geração)' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview (Experimental Avançado)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Estável)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Econômico)' },
];

export const DEFAULT_MODELS = {
    [AI_PROVIDERS.OPENAI]: 'gpt-4o-mini',
    [AI_PROVIDERS.GEMINI]: 'gemini-2.5-flash'
};
