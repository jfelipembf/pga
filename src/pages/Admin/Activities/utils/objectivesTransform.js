/**
 * Transforma objectives do formato Firestore (objeto aninhado) para array
 * Filtra itens deletados e ordena por order
 */
export const transformObjectivesToArray = (objectives) => {
    if (!objectives) return []
    if (Array.isArray(objectives)) return objectives

    return Object.entries(objectives)
        .filter(([_, obj]) => obj && !obj.deleted)
        .map(([key, obj]) => ({
            id: obj.idObjective || key,
            title: obj.title || '',
            order: obj.order || 0,
            topics: transformTopicsToArray(obj.topics)
        }))
        .sort((a, b) => a.order - b.order)
}

/**
 * Transforma topics do formato Firestore (objeto aninhado) para array
 * Filtra itens deletados e ordena por order
 */
const transformTopicsToArray = (topics) => {
    if (!topics) return []
    if (Array.isArray(topics)) return topics

    return Object.entries(topics)
        .filter(([_, topic]) => topic && !topic.deleted)
        .map(([topicKey, topic]) => ({
            id: topic.idTopic || topicKey,
            description: topic.description || '',
            isFundamental: !!topic.isFundamental,
            order: topic.order || 0
        }))
        .sort((a, b) => a.order - b.order)
}

/**
 * Verifica se objectives está vazio
 */
export const hasObjectives = (objectives) => {
    if (!objectives) return false
    if (Array.isArray(objectives)) return objectives.length > 0
    if (typeof objectives === 'object') return Object.keys(objectives).length > 0
    return false
}
