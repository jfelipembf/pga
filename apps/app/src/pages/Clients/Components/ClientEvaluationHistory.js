import React, { useMemo } from "react"
import { Card, CardBody, CardHeader, Button, Badge } from "reactstrap"
import { ACTIVITIES } from "../../../pages/Admin/Activities/Constants/activitiesDefaults"

const historyEvents = [
  {
    date: "05/02/2025",
    title: "Início no Baby 1",
    activityId: "baby-1",
    note: "Ambientação e primeiros contatos com a água.",
    topics: ["Respira com rosto na água", "Flutuação assistida"],
  },
  {
    date: "18/04/2025",
    title: "Concluiu Baby 1",
    activityId: "baby-1",
    note: "Flutuação ventral e dorsal sem material.",
    topics: ["Flutua sem material", "Aceita respingos sem medo"],
  },
  {
    date: "02/05/2025",
    title: "Início no Baby 2",
    activityId: "baby-2",
    note: "Autonomia maior na água e mergulho guiado.",
    topics: ["Mergulho com expiração", "Movimenta pernas sem auxílio"],
  },
  {
    date: "30/08/2025",
    title: "Concluiu Baby 2",
    activityId: "baby-2",
    note: "Salto com retorno à superfície e deslocamento curto.",
    topics: ["Salta e submerge sozinho", "Ondulação básica com prancha"],
  },
  {
    date: "05/09/2025",
    title: "Subiu para Estágio 1",
    activityId: "stage-1",
    note: "Introdução ao nado crawl e controle respiratório.",
    topics: ["Bolhas contínuas", "Pernada de crawl com prancha"],
  },
  {
    date: "15/01/2026",
    title: "Concluiu Estágio 1",
    activityId: "stage-1",
    note: "Braçada e pernada de crawl completas, flutuação estável.",
    topics: ["Coordenação crawl curta", "Flutuação dorsal estável"],
  },
  {
    date: "20/01/2026",
    title: "Início Estágio 2",
    activityId: "stage-2",
    note: "Lapidação técnica e introdução a costas/peito/borboleta.",
    topics: ["Braçada com respiração lateral", "Saída em pé com impulso"],
  },
]

const activityById = ACTIVITIES.reduce((acc, act) => {
  acc[act.id] = act
  return acc
}, {})

const ClientEvaluationHistory = ({ onBack }) => {
  const rows = useMemo(() => {
    const chunkSize = 5
    const chunks = []
    for (let i = 0; i < historyEvents.length; i += chunkSize) {
      const slice = historyEvents.slice(i, i + chunkSize)
      const rowIndex = Math.floor(i / chunkSize)
      const reversed = rowIndex % 2 === 1
      chunks.push({
        rowIndex,
        reversed,
        items: reversed ? [...slice].reverse() : slice,
        raw: slice,
      })
    }
    return chunks
  }, [])

  return (
    <Card className="shadow-sm">
      <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="mb-0">Histórico de evolução</h5>
          <p className="text-muted small mb-0">Linha do tempo com níveis e tópicos aprendidos.</p>
        </div>
        <Button color="light" size="sm" onClick={onBack}>
          <i className="mdi mdi-arrow-left" /> Voltar
        </Button>
      </CardHeader>
      <CardBody>
        <section id="cd-timeline" className="cd-container">
          {historyEvents.map((evt, idx) => {
            const act = activityById[evt.activityId]
            const color = act?.color || "#466b8f"
            const isEven = idx % 2 === 1
            const label = evt.title.toLowerCase()
            const isStageChange = label.includes("início") || label.includes("subiu")
            const improvements = Math.max(1, evt.topics.length - 1)
            return (
              <div
                className={`cd-timeline-block ${isEven ? "timeline-left" : "timeline-right"}`}
                key={`${evt.activityId}-${evt.date}`}
              >
                <div className="cd-timeline-img" style={{ backgroundColor: color }}>
                  <i className="mdi mdi-checkbox-blank-circle-outline" />
                </div>

                <div className={`cd-timeline-content shadow-sm ${isStageChange ? "timeline-stage-change" : ""}`}>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                    <h3 className="mb-2">{evt.title}</h3>
                    <span className="badge bg-success text-white px-3 py-2 fs-6">+{improvements}</span>
                  </div>
                  <p className="mb-2 text-muted">{act?.name || "Nível"}</p>
                  <p className="mb-3 text-muted">{evt.note}</p>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {evt.topics.map(topic => (
                      <Badge key={topic} color="light" className="text-muted border">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <span className="cd-date">{evt.date}</span>
                </div>
              </div>
            )
          })}
        </section>
      </CardBody>
    </Card>
  )
}

export default ClientEvaluationHistory
