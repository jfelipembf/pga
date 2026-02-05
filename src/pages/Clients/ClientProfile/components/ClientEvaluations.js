import React from "react"
import { Card, CardBody, Table, Badge, Spinner } from "reactstrap"
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
                    <div className="bg-light p-3 border-bottom d-flex align-items-center justify-content-between">
                        <h6 className="mb-0 fw-bold text-primary text-uppercase letter-spacing-1">
                            <i className="mdi mdi-swim me-2"></i>
                            {activity.activityName}
                        </h6>
                        <Badge color="soft-primary" pill>Últimas 5 Avaliações</Badge>
                    </div>
                    <CardBody className="p-0">
                        <div className="table-responsive">
                            <Table className="mb-0 table-nowrap align-middle">
                                <thead className="bg-white">
                                    <tr>
                                        <th style={{ width: '40%', borderTop: 'none' }}>Objetivos / Tópicos</th>
                                        {activity.dates.map((date, idx) => (
                                            <th key={idx} className="text-center" style={{ borderTop: 'none' }}>
                                                <div className="small text-muted mb-1">DATA</div>
                                                <div className="fw-bold">{date}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activity.objectives.map(obj => (
                                        <React.Fragment key={obj.id}>
                                            <tr className="bg-soft-light">
                                                <td colSpan={activity.dates.length + 1} className="py-2">
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
                                                    {topic.values.map((val, idx) => (
                                                        <td key={idx} className="text-center">
                                                            {val ? (
                                                                <Badge
                                                                    color={
                                                                        val.toLowerCase() === 'aprovado' || val.toLowerCase() === 'concluído' ? 'success' :
                                                                            val.toLowerCase() === 'pendente' ? 'warning' : 'info'
                                                                    }
                                                                    className="px-2"
                                                                >
                                                                    {val}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted opacity-25">-</span>
                                                            )}
                                                        </td>
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
