import { useCallback } from "react"

import clientsEvaluationService from "../../services/ClientsEvaluation"

const buildLevelEntry = (levels, levelId) => {
  const chosenLevelId = String(levelId || "")
  const level = (Array.isArray(levels) ? levels : []).find(l => String(l.id) === chosenLevelId)

  return {
    levelId: chosenLevelId || null,
    levelName: level?.title || "",
    levelValue: level?.value != null ? Number(level.value) : 0,
  }
}

const buildLevelEntryWithMeta = (levels, levelId, meta = null) => {
  const base = buildLevelEntry(levels, levelId)
  if (!meta) return base

  return {
    ...base,
    objectiveId: meta.objectiveId || null,
    objectiveName: meta.objectiveName || "",
    objectiveOrder: meta.objectiveOrder != null ? Number(meta.objectiveOrder) : 0,
    topicId: meta.topicId || null,
    topicName: meta.topicName || "",
    topicOrder: meta.topicOrder != null ? Number(meta.topicOrder) : 0,
  }
}

export const useSaveEvaluations = ({
  idActivity,
  classId,
  clients,
  excludedIds,
  draftLevelsByTopicId,
  allTopicIds,
  topicMetaById,
  defaultLevelId,
  levels,
  withLoading,
  toast,
  activeEventId, // NOVO: ID do evento de avaliação ativo
} = {}) => {
  const saveAll = useCallback(async () => {
    if (!idActivity) return

    // Se não houver evento ativo passado, bloqueia (embora a UI já deva ter bloqueado)
    if (!activeEventId) {
      toast?.show?.({
        title: "Erro ao salvar",
        description: "Nenhum evento de avaliação ativo identificado.",
        color: "danger",
      })
      return
    }

    const excluded = excludedIds instanceof Set ? excludedIds : new Set(excludedIds || [])

    // Deduplicate clients by ID to prevent double automation triggers
    const uniqueClientsMap = new Map();
    (Array.isArray(clients) ? clients : []).forEach(c => {
      if (c.id && !excluded.has(String(c.id))) {
        uniqueClientsMap.set(String(c.id), c);
      }
    });
    const activeclients = Array.from(uniqueClientsMap.values());

    if (!activeclients.length) return

    const draft = draftLevelsByTopicId || {}
    const draftTopicIds = Object.keys(draft)
    if (!draftTopicIds.length) {
      toast?.show?.({
        title: "Nada para salvar",
        description: "Você ainda não alterou nenhum nível.",
        color: "warning",
      })
      return
    }

    const run = async () => {
      const writes = activeclients.map(s => (async () => {
        const sId = String(s.id)

        // 1. Tentar buscar avaliação JÁ EXISTENTE para este evento
        let existingEval = null
        try {
          existingEval = await clientsEvaluationService.getClientEvaluationByEvent({
            idClient: sId,
            eventPlanId: activeEventId
          })
        } catch (err) {
          console.warn("Erro ao buscar avaliação existente", err)
        }

        // Se existe, usamos os níveis dela como base. Se não, usamos snapshot anterior ou vazio.
        let baseMap = {}

        if (existingEval) {
          baseMap = existingEval.levelsByTopicId && typeof existingEval.levelsByTopicId === "object"
            ? existingEval.levelsByTopicId
            : {}
        } else {
          // Se não existe avaliação neste evento, buscamos a última snapshot geral (comportamento original)
          // para preencher os buracos, SE desejado. 
          // O requisito diz: "gerado somente um documento... alteracao nesse periodo sera considerada uma edicao"
          // Se é um documento NOVO para este período, podemos começar do zero ou copiar do último evento.
          // Vamos manter a lógica de copiar do último snapshot para facilitar a vida do professor.
          const lastSnap = await clientsEvaluationService.getLastClientEvaluationSnapshot({
            idClient: sId,
            idActivity,
          })
          baseMap = lastSnap?.levelsByTopicId && typeof lastSnap.levelsByTopicId === "object" ? lastSnap.levelsByTopicId : {}
        }

        const nextMap = { ...baseMap }

          // Atualizar tópicos fixos (se houver necessidade de resetar padrão)
          ; (Array.isArray(allTopicIds) ? allTopicIds : []).forEach(tId => {
            // Só define padrão se não existir no mapa base. 
            // Se já existe (do update ou do snapshot), mantém.
            if (nextMap[tId] && typeof nextMap[tId] === "object") return
            nextMap[tId] = buildLevelEntryWithMeta(levels, defaultLevelId || "", topicMetaById?.[tId] || null)
          })

        // Atualizar com os drafts (mudanças atuais)
        draftTopicIds.forEach(tId => {
          const chosen = draft?.[tId]?.[sId]
          if (chosen == null) return
          nextMap[tId] = buildLevelEntryWithMeta(levels, chosen, topicMetaById?.[tId] || null)
        })

        // UPSERT: Se já existe, atualiza. Se não, cria.
        if (existingEval) {
          return clientsEvaluationService.updateClientEvaluation(existingEval.id, sId, {
            levelsByTopicId: nextMap,
            // Mantém outros campos originais
          })
        } else {
          return clientsEvaluationService.createClientEvaluation({
            idClient: sId,
            idActivity,
            idClass: classId,
            levelsByTopicId: nextMap,
            eventTypeName: "avaliação",
            eventPlanId: activeEventId, // Importante: Vincular ao evento
          })
        }
      })())

      await Promise.all(writes)

      toast?.show?.({
        title: "Avaliações salvas",
        description: "As avaliações foram salvas com sucesso.",
        color: "success",
      })
    }

    try {
      if (withLoading) {
        await withLoading("saveAll", run)
      } else {
        await run()
      }
    } catch (e) {
      console.error("Erro ao salvar avaliações", e)
      toast?.show?.({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as avaliações. Tente novamente.",
        color: "danger",
      })
    }
  }, [
    idActivity,
    classId,
    clients,
    excludedIds,
    draftLevelsByTopicId,
    allTopicIds,
    topicMetaById,
    defaultLevelId,
    levels,
    withLoading,
    toast,
    activeEventId, // Dep
  ])

  return { saveAll }
}

export default useSaveEvaluations
