/**
 * Formata os resultados da avaliação para envio via WhatsApp
 * Segue o padrão visual estrito com emojis e agrupamento.
 */
export const formatEvaluationResults = (evaluationData) => {
    if (!evaluationData || !evaluationData.levelsByTopicId) {
        return '';
    }

    const levels = Object.values(evaluationData.levelsByTopicId);

    // 1. Agrupar por Objetivo
    const groups = levels.reduce((acc, item) => {
        // Ignorar itens sem nível ou "Não avaliado" (ajustar lógica conforme necessidade)
        if (!item.levelName || item.levelName === 'Não avaliado') return acc;

        const objName = item.objectiveName || 'Geral';
        if (!acc[objName]) {
            acc[objName] = {
                items: [],
                order: item.objectiveOrder || 999
            };
        }
        acc[objName].items.push(item);
        return acc;
    }, {});

    // 2. Ordenar Objetivos
    const sortedObjectives = Object.keys(groups).sort((a, b) => {
        return groups[a].order - groups[b].order;
    });

    // 3. Gerar Texto
    const blocks = sortedObjectives.map(objName => {
        const group = groups[objName];

        // Ordenar Tópicos dentro do Objetivo
        const sortedItems = group.items.sort((a, b) => {
            return (a.topicOrder || 999) - (b.topicOrder || 999);
        });

        // Cabeçalho do Grupo
        let blockText = `🏊 *${objName}*\n`;

        // Itens
        blockText += sortedItems.map(item => {
            return `🔹 ${item.topicName}\n   ⭐ *${item.levelName}*`;
        }).join('\n');

        return blockText;
    });

    // 4. Juntar blocos com separador
    return blocks.join('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

/**
 * Substitui variáveis no template
 */
export const buildEvaluationMessage = (template, evaluation, student) => {
    const resultsBlock = formatEvaluationResults(evaluation);
    const dateStr = evaluation.date ? new Date(evaluation.date).toLocaleDateString('pt-BR') : '';

    return template
        .replace(/{student}|{name}/g, student.name.split(' ')[0]) // Primeiro nome
        .replace(/{results}/g, resultsBlock)
        .replace(/{date}/g, dateStr)
        .replace(/{phone}/g, student.phone || '');
};
