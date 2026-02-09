import React from "react"
import { Card, CardBody, Table, Badge, Spinner, Progress } from "reactstrap"
import { useClientEvaluations } from "../hooks/useClientEvaluations"

const ClientEvaluations = () => {
    const { loading, evaluationMatrix, hasEvaluations } = useClientEvaluations()

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2 text-muted">Carregando histórico de avaliações...</p>
            </div>
        )
    }

    if (!hasEvaluations) {
        return (
            <Card className="border shadow-none">
                <CardBody className="text-center py-5">
                    <i className="mdi mdi-clipboard-text-search-outline text-muted" style={{ fontSize: '3rem', opacity: 0.3 }} />
                    <h5 className="mt-3 fw-bold">Nenhuma avaliação encontrada</h5>
                    <p className="text-muted">Este aluno ainda não possui registros de avaliações técnicas ou testes.</p>
                </CardBody>
            </Card>
        )
    }

    return (
        <div className="client-evaluations">
            {evaluationMatrix.map(activity => (
                <Card key={activity.id} className="border shadow-none mb-4 overflow-hidden">
                    <div className="bg-light p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center">
                            <h6 className="mb-0 fw-bold text-primary text-uppercase letter-spacing-1">
                                <i className="mdi mdi-swim me-2"></i>
                                {activity.activityName}
                            </h6>
                        </div>

                        <div className="d-flex align-items-center gap-3 flex-grow-1 justify-content-end" style={{ maxWidth: '400px' }}>
                            <div className="flex-grow-1 d-none d-sm-block">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold text-muted">AVANÇO TÉCNICO</span>
                                    <span className="small fw-bold text-primary">{activity.advancePercentage}%</span>
                                </div>
                                <Progress value={activity.advancePercentage} color="primary" style={{ height: '6px' }} className="bg-white border" />
                            </div>
                            <Badge color="soft-primary" pill className="d-none d-md-block">Últimas 3 Avaliações</Badge>
                        </div>
                    </div>
                    <CardBody className="p-0">
                        <div className="table-responsive">
                            <Table className="mb-0 table-nowrap align-middle">
                                <thead className="bg-white">
                                    <tr>
                                        <th style={{ width: '40%', borderTop: 'none' }}>Objetivos / Tópicos</th>
                                        {activity.dates.map((date, idx) => (
                                            <React.Fragment key={idx}>
                                                <th className="text-center" style={{ borderTop: 'none' }}>
                                                    <div className="small text-muted mb-1">DATA</div>
                                                    <div className="fw-bold">{date}</div>
                                                </th>
                                                {idx < activity.dates.length - 1 && (
                                                    <th style={{ width: '40px', borderTop: 'none' }} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activity.objectives.map(obj => (
                                        <React.Fragment key={obj.id}>
                                            <tr className="bg-soft-light">
                                                <td colSpan={activity.dates.length * 2} className="py-2">
                                                    <span className="fw-bold text-dark small text-uppercase">
                                                        {obj.order != null ? `${obj.order}. ` : ""}{obj.title}
                                                    </span>
                                                </td>
                                            </tr>
                                            {obj.topics.map(topic => (
                                                <tr key={topic.id}>
                                                    <td className="ps-4">
                                                        <i className="mdi mdi-chevron-right text-muted me-1"></i>
                                                        <span className="text-muted small">{topic.title}</span>
                                                    </td>
                                                    {topic.values.map((valObj, idx) => (
                                                        <React.Fragment key={`${topic.id}-${idx}`}>
                                                            <td className="text-center">
                                                                {valObj ? (
                                                                    <Badge
                                                                        color={valObj.color || "info"}
                                                                        className="px-2"
                                                                    >
                                                                        {valObj.title}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-muted opacity-25">-</span>
                                                                )}
                                                            </td>
                                                            {idx < activity.dates.length - 1 && (
                                                                <td className="text-center p-0 align-middle" style={{ minWidth: '40px' }}>
                                                                    {topic.values[idx + 1]?.improved && (
                                                                        <div className="animate__animated animate__fadeIn" title="Houve melhora">
                                                                            <i className="mdi mdi-thumb-up text-success fs-5"></i>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    )
}

export default ClientEvaluations
