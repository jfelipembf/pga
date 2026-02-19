/**
 * Lógica pura para Sugestão de Planejamento de Aulas
 * Separada em serviço puro para ser reutilizável no Frontend (Hook) e Backend (Batch Jobs/Service)
 */
export const PlanningLogic = {
    /**
     * Calcula pontuação de defasagem para cada objetivo baseado na performance da turma.
     * @param {Array} objectivesData - Dados agregados do useEvaluationAnalysis
     * @returns {Array} Lista de objetivos com score calculado e ordenado decrescente.
     */
    rankObjectives: (objectivesData) => {
        if (!objectivesData || objectivesData.length === 0) return [];

        return objectivesData.map(obj => {
            const topics = obj.topics || [];
            if (topics.length === 0) return null;

            // Média de conclusão do objetivo (0 a 100)
            const sumPct = topics.reduce((acc, t) => acc + (t.percentage || 0), 0);
            const avgPct = sumPct / topics.length;
            const gap = 100 - avgPct; // Defasagem (quanto falta)

            // Verificar se contém tópico Fundamental
            const hasFundamental = topics.some(t => t.isFundamental);

            // Score = Defasagem * Peso
            // Peso: 3.0 se tiver fundamental, 1.0 se não.
            // Objetivo: Priorizar defasagens altas, especialmente em fundamentos.
            const weight = hasFundamental ? 3.0 : 1.0;
            const score = gap * weight;

            return {
                id: obj.id,
                title: obj.title,
                gap: gap.toFixed(0),
                score,
                hasFundamental,
                topicsSummary: topics.map(t => t.name).join(', ')
            };
        }).filter(Boolean).sort((a, b) => b.score - a.score);
    },

    /**
     * Seleciona os top 2 objetivos baseado nas regras de negócio (Para a semana ATUAL/ÚNICA):
     * 1. Pelo menos um Fundamental (se houver defasagem).
     * 2. O próximo maior defasagem.
     * @param {Array} rankedObjectives - Lista já ordenada por score
     * @returns {Array} Lista com até 2 objetivos selecionados com metadados (reason/type).
     */
    selectWeeklyObjectives: (rankedObjectives) => {
        if (!rankedObjectives || rankedObjectives.length === 0) return [];

        // 1. Selecionar Objetivo Primário (Obrigatório Fundamental de preferência)
        let primaryObj = rankedObjectives.find(o => o.hasFundamental);

        // Fallback: Se não houver fundamental pendente, pega o maior gap geral (o primeiro da lista)
        if (!primaryObj && rankedObjectives.length > 0) {
            primaryObj = rankedObjectives[0];
        }

        if (!primaryObj) return [];

        // 2. Selecionar Objetivo Secundário 
        // Deve ser o próximo maior score que seja diferente do primário
        const secondaryObj = rankedObjectives.find(o => o.id !== primaryObj.id);

        const suggestions = [
            {
                ...primaryObj,
                type: 'primary',
                reason: primaryObj.hasFundamental ? 'Fundamental Prioritário' : 'Maior Defasagem'
            }
        ];

        if (secondaryObj) {
            suggestions.push({
                ...secondaryObj,
                type: 'secondary',
                reason: 'Complementar'
            });
        }

        return suggestions;
    },

    /**
     * Gera uma sequência de sugestões para múltiplas semanas futuras, garantindo rotação e cobertura.
     * Regra: 2 Objetivos por semana. 1 Fundamental obrigatório (até acabar). Diferentes por semana.
     * @param {Array} objectivesData - Dados brutos da análise
     * @param {Number} weeksCount - Quantas semanas gerar no futuro (default 12)
     * @returns {Array} Array de arrays. Index 0 = Semana 1, Index 1 = Semana 2... e cada item é lista de objetivos.
     */
    generateFutureSequence: (objectivesData, weeksCount = 12) => {
        if (!objectivesData || objectivesData.length === 0) return Array(weeksCount).fill([]);

        // 1. Prepara e Classifica (Ranked)
        // Usamos o rankObjectives para ter metadata (hasFundamental, gap)
        const allObjectives = PlanningLogic.rankObjectives(objectivesData);

        // Separa em Filas Iniciais
        // Filtrar apenas com Gap > 0 (pendentes) para prioridade, mas manter concluídos no fim da fila para rotação se necessário
        const pending = allObjectives.filter(o => o.gap > 0);
        const completed = allObjectives.filter(o => o.gap <= 0);

        // Filas de Trabalho (Work Queues)
        let fundamentalsQueue = pending.filter(o => o.hasFundamental);
        let othersQueue = pending.filter(o => !o.hasFundamental);
        let completedQueue = [...completed]; // Backup para quando tudo acabar

        // Se não tiver pendentes, usa tudo para rotação (manutenção)
        if (pending.length === 0) {
            fundamentalsQueue = allObjectives.filter(o => o.hasFundamental);
            othersQueue = allObjectives.filter(o => !o.hasFundamental);
        }

        const weeklySequence = [];

        for (let i = 0; i < weeksCount; i++) {
            const weekSuggestions = [];

            // SLOT 1: Prioridade Fundamental
            let primary = null;
            if (fundamentalsQueue.length > 0) {
                primary = fundamentalsQueue.shift(); // Remove do topo
            } else if (othersQueue.length > 0) {
                primary = othersQueue.shift();
            } else {
                // Filas vazias: Reciclar (Resetar ciclo)
                // Se ambas as filas esvaziaram, reabastece com os pendentes originais (rotação)
                // Ou pega dos concluídos se não tiver mais pendentes
                const recycleSource = pending.length > 0 ? pending : allObjectives;
                fundamentalsQueue = recycleSource.filter(o => o.hasFundamental);
                othersQueue = recycleSource.filter(o => !o.hasFundamental);

                // Tenta pegar de novo após reset
                if (fundamentalsQueue.length > 0) primary = fundamentalsQueue.shift();
                else if (othersQueue.length > 0) primary = othersQueue.shift();
            }

            if (primary) {
                weekSuggestions.push({
                    ...primary,
                    type: 'primary',
                    reason: primary.hasFundamental ? 'Fundamental (Rotação)' : 'Prática (Rotação)'
                });
            }

            // SLOT 2: Complementar (O que tiver disponível na outra fila ou na mesma)
            let secondary = null;
            if (othersQueue.length > 0) {
                secondary = othersQueue.shift();
            } else if (fundamentalsQueue.length > 0) {
                secondary = fundamentalsQueue.shift();
            } else {
                // Filas vazias novamente no slot 2?
                // Tenta pegar dos reciclados ou concluídos, mas garante que não repete o primary
                const recycleSource = pending.length > 0 ? pending : allObjectives;
                const pool = recycleSource.filter(o => o.id !== primary?.id);
                if (pool.length > 0) secondary = pool[0]; // Pega o primeiro disponível que não é o primary
            }

            // Se ainda assim não achou secondary (ex: só tem 1 objetivo no curso todo), fica só com primary.
            // Se achou, adiciona.
            if (secondary && secondary.id !== primary?.id) {
                weekSuggestions.push({
                    ...secondary,
                    type: 'secondary',
                    reason: 'Complementar (Rotação)'
                });
            }

            // Adiciona semana à sequência
            weeklySequence.push(weekSuggestions);

            // Opcional: Re-injetar os usados no fim da fila IMEDIATAMENTE? 
            // Não. A ideia é esgotar a fila antes de repetir. 
            // A lógica de "Reciclar" acima (linhas 137-142) cuida de reabastecer quando acaba.
        }

        return weeklySequence;
    }
};
