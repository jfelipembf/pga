import { useState } from 'react';
import { aiService } from '../../../services/Automation/AIService';
import { integrationRepository } from '../../../data/repositories/Automation/IntegrationRepository';
import { useTenant } from '../../../hooks/useTenant';
import { toast } from 'react-toastify';
import { SWIMMING_STYLES, EQUIPMENT } from '../constants/trainingConstants';

/**
 * Helper para limpar e parsear JSON da IA de forma robusta
 */
const parseAIResponse = (response) => {
    if (!response) return null;
    try {
        let jsonStr = response;
        // 1. Remover markdown ```json ... ``` ou ``` ... ```
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');

        // 2. Encontrar o primeiro '{' e o último '}'
        const first = jsonStr.indexOf('{');
        const last = jsonStr.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
            jsonStr = jsonStr.substring(first, last + 1);
        }

        // 3. Remover comentários de linha // (cuidado com URLs http://)
        jsonStr = jsonStr.replace(/([^:]|^)\/\/.*$/gm, '$1');

        // 4. Remover trailing commas (vírgula antes de fechar } ou ])
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Erro parsing JSON IA:", e);
        console.log("Raw Response:", response);
        return null;
    }
};

/**
 * Hook para integrar IA na geração de treinos de natação.
 * Busca as chaves de API das configurações do tenant e constrói o prompt profissional.
 */
export const useTrainingAI = () => {
    const { idTenant } = useTenant();
    const [loading, setLoading] = useState(false);

    /**
     * Busca as configurações de IA do tenant (chave, provedor, modelo)
     */
    const getAIConfig = async () => {
        const settings = await integrationRepository.getSettings(idTenant);
        if (!settings) {
            toast.warning("Configure a IA em Sistema > Integrações.");
            return null;
        }

        // Ler o provedor selecionado (padrão: gemini)
        const provider = settings.aiProvider || 'gemini';
        const apiKey = provider === 'openai' ? settings.openaiKey : settings.geminiKey;
        let model = provider === 'openai' ? settings.openaiModel : settings.geminiModel;

        if (!apiKey) {
            toast.warning(`Chave de API do ${provider} não configurada. Vá em Sistema > Integrações.`);
            return null;
        }

        // Validar se o modelo salvo ainda é válido (modelos antigos podem ter sido removidos)
        const VALID_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        if (provider === 'gemini' && model && !VALID_GEMINI_MODELS.includes(model)) {
            console.warn(`[useTrainingAI] Modelo '${model}' não é válido. Usando gemini-2.5-flash.`);
            model = 'gemini-2.5-flash';
        }

        return {
            apiKey: apiKey.trim(),
            provider,
            model: model || 'gemini-2.5-flash',
            customInstructions: settings.trainingPrompt || ''
        };
    };

    /**
     * Gera o prompt profissional com base nos dados do Copilot
     */
    const buildPrompt = (config, customInstructions) => {
        const stylesRef = SWIMMING_STYLES.map(s => s.value).join(', ');
        const equipRef = EQUIPMENT.map(e => `"${e.value}" (${e.label})`).join(', ');

        return `Você é um Head Coach de natação profissional.
Gere um treino de natação COMPLETO no formato JSON.

${customInstructions ? `INSTRUÇÕES DO TREINADOR (SIGA RIGOROSAMENTE):\n${customInstructions}\n` : ''}
${config.focusNotes ? `INSTRUÇÕES ESPECÍFICAS DESTE TREINO:\n${config.focusNotes}\n` : ''}

PARÂMETROS DO TREINO:
- Piscina: ${config.poolLength}m (TODAS as distâncias devem ser múltiplas de ${config.poolLength})
- Metragem total desejada: ${config.totalDistance ? config.totalDistance + 'm' : 'calcular pela duração'}
- Duração: ${config.sessionDuration} minutos
- Nado principal: ${config.mainStyle || 'crawl'}
- Modalidade: ${config.modality || 'competitivo'}
${config.phase ? `- Fase do macrociclo: ${config.phase}` : ''}
${config.objective ? `- Objetivo principal: ${config.objective}` : ''}
${config.raceDistance ? `- Prova alvo: ${config.raceDistance}` : ''}

REGRAS OBRIGATÓRIAS:
1. O treino DEVE ter 3 a 5 seções (Aquecimento, Educativo/Técnica, Série Principal, Soltura no mínimo).
2. Cada seção deve ter de 2 a 6 exercícios variados.
3. Distâncias em METROS, SEMPRE múltiplas de ${config.poolLength}.
4. Use APENAS estes estilos (campo "style"): ${stylesRef}
5. Use APENAS estas zonas de intensidade (campo "intensity"): A0, A1, A2, A3, VO2, AN, VEL, TEC
6. Para equipamentos (campo "equipment"), use array com valores: ${equipRef} ou [] se nenhum.
7. O campo "interval" é o DESCANSO entre repetições em SEGUNDOS (string). Ex: "15", "20", "30".
8. O campo "reps" é quantas vezes o nadador faz a distância. Ex: reps: 4, distance: 100 = 4x100m.
9. O campo "exercise" é uma descrição curta do exercício. Ex: "Crawl progressivo", "Educativo de braçada".

FORMATO JSON EXATO (retorne APENAS isto, sem texto antes ou depois):
{
  "description": "Nome descritivo do treino",
  "sections": [
    {
      "name": "Aquecimento",
      "items": [
        { "reps": 1, "distance": 400, "exercise": "Nado livre solto", "style": "crawl", "intensity": "A1", "equipment": [], "interval": "0" },
        { "reps": 4, "distance": 50, "exercise": "Educativo de perna", "style": "crawl", "intensity": "A1", "equipment": ["board"], "interval": "15" }
      ]
    },
    {
      "name": "Série Principal",
      "items": [
        { "reps": 8, "distance": 100, "exercise": "Crawl progressivo 1-4", "style": "crawl", "intensity": "A3", "equipment": [], "interval": "20" }
      ]
    },
    {
      "name": "Soltura",
      "items": [
        { "reps": 1, "distance": 200, "exercise": "Nado livre bem solto", "style": "freestyle_choice", "intensity": "A0", "equipment": [], "interval": "0" }
      ]
    }
  ]
}

Gere um treino profissional, variado e criativo. Retorne APENAS o JSON válido.`;
    };

    /**
     * Gera treino via IA — usada tanto pelo botão rápido quanto pelo Copilot
     */
    const generateWorkout = async (config) => {
        if (!idTenant) return null;

        setLoading(true);
        try {
            const aiConfig = await getAIConfig();
            if (!aiConfig) {
                setLoading(false);
                return null;
            }

            const prompt = buildPrompt(config, aiConfig.customInstructions);

            console.log('[useTrainingAI] Gerando treino...', {
                provider: aiConfig.provider,
                model: aiConfig.model,
                poolLength: config.poolLength,
                totalDistance: config.totalDistance,
                duration: config.sessionDuration
            });

            const result = await aiService.generateText(prompt, {}, {
                apiKey: aiConfig.apiKey,
                provider: aiConfig.provider,
                model: aiConfig.model
            });

            if (!result) {
                toast.error("A IA não retornou resposta. Verifique sua chave de API.");
                return null;
            }

            // Limpar e parsear o JSON da resposta
            const workout = parseAIResponse(result);

            if (!workout) {
                toast.error("A IA retornou um formato inválido. Tente novamente.");
                return null;
            }

            // Validar estrutura mínima
            if (!workout.sections || !Array.isArray(workout.sections)) {
                throw new Error("JSON inválido: 'sections' ausente.");
            }

            console.log('[useTrainingAI] Treino gerado com sucesso:', workout.description);
            return workout;

        } catch (error) {
            console.error("[useTrainingAI] Erro na geração:", error);

            if (error.message?.includes('404')) {
                toast.error("Modelo de IA não encontrado. Verifique a configuração em Sistema > Integrações.");
            } else if (error instanceof SyntaxError) {
                toast.error("A IA retornou um formato inválido. Tente novamente.");
            } else {
                toast.error(error.message || "Falha ao gerar treino com IA.");
            }
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Manter compatibilidade — agora ambos usam a mesma função
    const generateCopilotWorkout = generateWorkout;

    return { generateWorkout, generateCopilotWorkout, loading };
};
