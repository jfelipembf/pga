import React from "react"
import { Badge, Card, CardBody, CardHeader, Table } from "reactstrap"

import { getLevelColor } from "../Utils/evaluationUtils"
import { useClientEvaluation } from "../Hooks/useClientEvaluation"

// Inline functions removed (levelColor, toJsDate)

const ClientEvaluation = ({ clientId }) => {
  const {
    loading,
    visibleEvaluations,
    objectives,
    levelsConfig
  } = useClientEvaluation(clientId)

  if (loading) {
    return (
      <Card className="shadow-sm client-evaluation">
        <CardHeader>
          <h5 className="mb-0">Avaliação</h5>
        </CardHeader>
        <CardBody>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Carregando avaliações...</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  // Calculate max possible value from levels config (e.g. 4 for 0-4 scale)
  const maxLevel = levelsConfig.find(l => l.value === Math.max(...levelsConfig.map(x => x.value)))
  const maxValue = maxLevel ? Number(maxLevel.value) : 0

  return (
    <Card className="shadow-sm client-evaluation">
      <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div>
            <h5 className="mb-0">Avaliação</h5>
            <p className="text-muted small mb-0">Progresso do aluno.</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="table-responsive">
          <Table bordered hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 260 }}># / Objetivos e tópicos</th>
                {visibleEvaluations.map(ass => (
                  <th key={ass.id} className="text-center" style={{ minWidth: 150 }}>
                    {ass.label}
                  </th>
                ))}
              </tr>
              {/* Progress Bar Row */}
              <tr>
                <th className="text-end text-muted small fw-normal">Progresso Geral</th>
                {visibleEvaluations.map(ass => {
                  let totalPoints = 0
                  let totalTopics = 0

                  // Iterate over all objectives/topics to calculate score for THIS evaluation (ass)
                  objectives.forEach(obj => {
                    obj.topics.forEach(topic => {
                      totalTopics++
                      const result = ass.topics.find(t => t.idTopic === topic.id)
                      const val = Number(result?.levelValue || 0)
                      totalPoints += val
                    })
                  })

                  const maxPossible = totalTopics * maxValue
                  const ratio = maxPossible > 0 ? totalPoints / maxPossible : 0
                  const percentage = Math.round(ratio * 100)

                  return (
                    <th key={`progress-${ass.id}`} className="text-center p-2">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px', maxWidth: '100px', backgroundColor: '#e9ecef' }}>
                          <div
                            className="progress-bar rounded-pill"
                            role="progressbar"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: percentage >= 85 ? '#10b981' : '#3b82f6' // Green if >= 85, else Blue
                            }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <span className="small fw-bold text-muted">{percentage}%</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => (
                <React.Fragment key={obj.id}>
                  <tr className="table-active">
                    <td colSpan={visibleEvaluations.length + 1} className="fw-semibold text-uppercase font-size-12 text-muted">
                      {obj.index}. {obj.title}
                    </td>
                  </tr>
                  {obj.topics.map((topic, idx) => (
                    <tr key={topic.key || topic.id}>
                      <td>
                        <div className="fw-semibold text-dark">{topic.description}</div>
                      </td>
                      {visibleEvaluations.map(ass => {
                        const result = ass.topics.find(t => t.idTopic === topic.id)
                        const color = getLevelColor(result?.levelValue || 0)
                        return (
                          <td key={`${ass.id}-${topic.id}`} className="text-center">
                            <Badge color={color} pill className="text-wrap px-2">
                              {result?.levelLabel || "Não avaliado"}
                            </Badge>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {!objectives.length && (
                <tr>
                  <td colSpan={visibleEvaluations.length + 1} className="text-muted text-center py-4">
                    Nenhuma avaliação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </CardBody>
    </Card>
  )
}

export default ClientEvaluation
