import { formatDate } from "../../../helpers/date"

export const getLevelColor = val => {
    if (val >= 4) return "success"
    if (val >= 3) return "info"
    if (val >= 2) return "warning"
    return "secondary"
}

export const toJsDate = value => {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value?.toDate === "function") return value.toDate()
    if (typeof value?.seconds === "number") return new Date(value.seconds * 1000)
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
}

export const normalizeEvaluations = (evaluations) => {
    const docs = Array.isArray(evaluations) ? evaluations : []
    if (!docs.length) return []

    const sorted = docs.slice().sort((a, b) => {
        const da = toJsDate(a?.createdAt || a?.date)
        const db = toJsDate(b?.createdAt || b?.date)
        const ta = da ? da.getTime() : 0
        const tb = db ? db.getTime() : 0
        return tb - ta
    })

    return sorted.map((evalDoc, idx) => {
        const d = toJsDate(evalDoc?.createdAt || evalDoc?.date)
        const safeDate = d || new Date()

        const topics = []
        if (evalDoc?.levelsByTopicId && typeof evalDoc.levelsByTopicId === "object") {
            Object.entries(evalDoc.levelsByTopicId).forEach(([topicId, levelData]) => {
                if (!levelData || typeof levelData !== "object") return

                const objectiveId = String(levelData.objectiveId || levelData.idObjective || "").trim()
                const objectiveName =
                    levelData.objectiveName || levelData.objectiveTitle || levelData.idObjective || "Objetivo"
                const topicName = levelData.topicName || levelData.topicDescription || `Tópico ${topicId}`
                const objectiveOrder = levelData.objectiveOrder != null ? Number(levelData.objectiveOrder) : 0
                const topicOrder = levelData.topicOrder != null ? Number(levelData.topicOrder) : 0

                topics.push({
                    idObjective: objectiveId || (levelData.idObjective ? String(levelData.idObjective) : ""),
                    objectiveName,
                    objectiveOrder,
                    idTopic: String(levelData.topicId || topicId),
                    topicName,
                    topicOrder,
                    levelLabel: levelData.levelName || levelData.levelId || "Não avaliado",
                    levelValue: typeof levelData.levelValue === "number" ? levelData.levelValue : 0,
                })
            })
        }

        return {
            id: evalDoc?.idEvaluation || evalDoc?.id || `${safeDate.getTime()}-${idx}`,
            label: formatDate(safeDate),
            topics,
        }
    })
}

export const buildEvaluationObjectives = (visibleEvaluations) => {
    const map = new Map()
    visibleEvaluations.forEach(ev => {
        ev.topics.forEach(t => {
            const title = t.objectiveName || t.idObjective || "Objetivo"
            const key = (t.idObjective || title).toString().trim().toLowerCase()
            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    title,
                    order: t.objectiveOrder != null ? Number(t.objectiveOrder) : 0,
                    topics: [],
                })
            }
            const obj = map.get(key)
            const topicKey = `${key}|${(t.idTopic || t.topicName || "topico").toString().trim().toLowerCase()}`
            if (!obj.topics.find(top => top.key === topicKey)) {
                obj.topics.push({
                    key: topicKey,
                    id: t.idTopic || topicKey,
                    description: t.topicName || t.idTopic || "Tópico",
                    order: t.topicOrder != null ? Number(t.topicOrder) : 0,
                })
            }
        })
    })

    const sortedObjectives = Array.from(map.values()).sort((a, b) => {
        const ao = Number(a.order || 0)
        const bo = Number(b.order || 0)
        if (ao !== bo) return ao - bo
        return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR")
    })

    // ordenar tópicos e numerar
    return sortedObjectives.map((obj, index) => ({
        ...obj,
        index: index + 1,
        topics: (obj.topics || [])
            .slice()
            .sort((a, b) => {
                const ao = Number(a.order || 0)
                const bo = Number(b.order || 0)
                if (ao !== bo) return ao - bo
                return String(a.description || "").localeCompare(String(b.description || ""), "pt-BR")
            }),
    }))
}
