import React, { useState, useEffect } from "react"
import { Container, Row, Col, Card, CardBody, Input, ListGroup, ListGroupItem, Spinner } from "reactstrap"

// Components
import Header from "./Components/Header"

// Hook
import { useKiosk } from "./Hooks/useKiosk"

// Assets
import bg from "../../assets/images/bg-1.png"
// Data

const Kiosk = () => {
    const {
        loadingIds,
        loadingClients,
        searchTerm,
        setSearchTerm,
        filteredClients,
        selectedClient,
        evaluations, // Real evaluations from hook
        loadingEvaluations,
        activityName,
        levelsConfig, // Get config
        handleSelectClient,
        handleClearSelection
    } = useKiosk()

    // State for selected evaluation ID
    const [selectedEvalId, setSelectedEvalId] = useState("")

    // Update selected evaluation when list loads
    useEffect(() => {
        if (evaluations.length > 0) {
            // Default to the most recent (first in list usually, but let's ensure)
            setSelectedEvalId(evaluations[0].id)
        } else {
            setSelectedEvalId("")
        }
    }, [evaluations])

    if (loadingIds) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner color="primary" />
            </div>
        )
    }

    // Helper: Find current and previous evaluation for comparison
    const currentEvaluation = evaluations.find(e => e.id === selectedEvalId)
    const currentIndex = evaluations.findIndex(e => e.id === selectedEvalId)
    // Assuming evaluations are sorted DESC (newest first)
    const previousEvaluation = currentIndex >= 0 && currentIndex < evaluations.length - 1
        ? evaluations[currentIndex + 1]
        : null

    // Helper: Dynamic Style Generator
    const getLevelStyle = (value) => {
        const val = Number(value || 0)

        // 1. Determine Max Value from Config
        const maxLevel = levelsConfig.find(l => l.value === Math.max(...levelsConfig.map(x => x.value)))
        const maxValue = maxLevel ? Number(maxLevel.value) : 4 // Default to 4 if config fails

        // 2. Identify if it's "Not Evaluated" (usually 0 or the lowest)
        // If value is 0, we treat as neutral
        if (val === 0) return { color: "secondary", icon: "mdi-minus" }

        // 3. Calculate Ratio
        const ratio = val / maxValue

        // 4. Assign Color based on Ratio
        if (ratio <= 0.25) return { color: "danger", icon: "mdi-star-outline" }     // ~25% (Beginner)
        if (ratio <= 0.50) return { color: "warning", icon: "mdi-star-half" }       // ~50% (Regular)
        if (ratio <= 0.85) return { color: "info", icon: "mdi-star" }               // ~75-85% (Good)
        return { color: "success", icon: "mdi-check-decagram" }                     // >85% (Very Good/Excellent)
    }

    // Helper: Render Level Badge (Real Data + Dynamic Style)
    const renderLevel = (topicId) => {
        if (!currentEvaluation) return <span className="text-muted small">Não avaliado</span>

        const levelData = currentEvaluation.levelsByTopicId?.[topicId]

        // If not evaluated in this specific evaluation
        if (!levelData) return <span className="text-muted small">-</span>

        // Find match in our LEVELS constant based on value or ID if needed.
        // Assuming levelData has { levelName, levelValue, levelColor, levelIcon } or similar
        // OR we map from our local const. Let's try to map from local const by Value if possible,
        // or fallback to saved data.

        // Strategies:
        // A) Use saved styling if available (not currently saved)
        // B) Map stored 'levelValue' to our LEVEL_STYLES constant

        const style = getLevelStyle(levelData.levelValue)

        return (
            <span
                className={`badge bg-${style.color} bg-opacity-25 text-${style.color} font-size-12 p-2 d-inline-block`}
                style={{ width: '110px' }}
            >
                <i className={`mdi ${style.icon} me-1`}></i>
                {levelData.levelName || levelData.label}
            </span>
        )
    }

    // Helper: Check Improvement
    const checkImprovement = (topicId) => {
        if (!currentEvaluation || !previousEvaluation) return false

        const current = currentEvaluation.levelsByTopicId?.[topicId]
        const previous = previousEvaluation.levelsByTopicId?.[topicId]

        if (!current || !previous) return false

        // Compare values (assuming higher value = better)
        // Ensure values are numbers
        const valCur = Number(current.levelValue || 0)
        const valPrev = Number(previous.levelValue || 0)

        return valCur > valPrev
    }

    const { format } = require("date-fns")
    const { ptBR } = require("date-fns/locale")

    return (
        <div
            className="account-pages pt-sm-5 position-relative" // Removed my-5
            style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '100vh',
                overflowX: 'hidden'
            }}
        >
            <Container className="h-100">
                <Row className="justify-content-center h-100">
                    <Col md={8} lg={6} xl={5} className="h-100">
                        <Card className="overflow-hidden m-0 shadow-lg" style={{ minHeight: '100vh', borderRadius: '0' }}>
                            <Header />
                            <CardBody className="pt-0">
                                <div className="p-4">

                                    {!selectedClient ? (
                                        <div className="mb-3 position-relative">
                                            <label htmlFor="student-search" className="form-label fs-5 fw-bold text-primary mb-3">Consulte a última avaliação do seu filho</label>
                                            <Input
                                                id="student-search"
                                                type="text"
                                                placeholder="Digite o nome do aluno..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="form-control-lg py-3 shadow-sm border-0 bg-light"
                                                style={{ fontSize: '1.2rem' }}
                                                autoComplete="off"
                                            />
                                            {loadingClients && <div className="mt-2 text-muted small"><i className="mdi mdi-loading mdi-spin me-1"></i> Carregando alunos...</div>}

                                            {filteredClients.length > 0 && (
                                                <ListGroup className="position-absolute w-100 shadow-lg animate__animated animate__fadeIn" style={{ zIndex: 10, top: '100px', maxHeight: '300px', overflowY: 'auto' }}>
                                                    {filteredClients.map(client => (
                                                        <ListGroupItem
                                                            key={client.id}
                                                            action
                                                            onClick={() => handleSelectClient(client)}
                                                            className="d-flex align-items-center p-3 cursor-pointer border-bottom"
                                                            tag="button"
                                                        >
                                                            <div
                                                                className="rounded-circle me-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                                                                style={{ width: '50px', height: '50px', overflow: 'hidden' }}
                                                            >
                                                                {client.photo || client.avatar ? (
                                                                    <img src={client.photo || client.avatar} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                                                                ) : (
                                                                    <span className="text-primary fw-bold fs-5">
                                                                        {(client.firstName || client.name || "?").charAt(0)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0 text-dark fw-bold">{client.firstName} {client.lastName}</h6>
                                                            </div>
                                                        </ListGroupItem>
                                                    ))}
                                                </ListGroup>
                                            )}

                                            {/* Legend / Explanation Section */}
                                            <div className="mt-5 pt-4 border-top">
                                                <h6 className="text-muted fw-bold mb-3 small text-uppercase">Entenda sua Avaliação</h6>

                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    <span className="badge bg-secondary bg-opacity-25 text-secondary p-2"><i className="mdi mdi-minus me-1"></i> Não Avaliado</span>
                                                    <span className="badge bg-danger bg-opacity-25 text-danger p-2"><i className="mdi mdi-star-outline me-1"></i> Iniciante</span>
                                                    <span className="badge bg-warning bg-opacity-25 text-warning p-2"><i className="mdi mdi-star-half me-1"></i> Regular</span>
                                                    <span className="badge bg-info bg-opacity-25 text-info p-2"><i className="mdi mdi-star me-1"></i> Bom</span>
                                                    <span className="badge bg-success bg-opacity-25 text-success p-2"><i className="mdi mdi-check-decagram me-1"></i> Muito Bom</span>
                                                </div>

                                                <div className="alert alert-info bg-opacity-10 border-0 mb-3">
                                                    <div className="d-flex">
                                                        <i className="mdi mdi-trophy-outline fs-4 me-3 text-primary"></i>
                                                        <div>
                                                            <p className="mb-0 small text-dark">
                                                                Para avançar de nível, o aluno precisa atingir <strong>85%</strong> de aproveitamento nos objetivos propostos.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center bg-light p-3 rounded">
                                                    <i className="mdi mdi-flash text-success fs-3 me-3 animate__animated animate__pulse animate__infinite"></i>
                                                    <p className="mb-0 small text-muted">
                                                        O raio verde indica que houve <strong>evolução</strong> neste item em comparação com a avaliação anterior!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate__animated animate__fadeIn">
                                            <div className="d-flex align-items-center mb-4">
                                                <div
                                                    className="me-3 rounded-circle border border-3 border-primary p-1"
                                                    style={{ width: '80px', height: '80px' }}
                                                >
                                                    <div className="w-100 h-100 rounded-circle overflow-hidden bg-light d-flex align-items-center justify-content-center">
                                                        {selectedClient.photo || selectedClient.avatar ? (
                                                            <img src={selectedClient.photo || selectedClient.avatar} alt="Aluno" className="w-100 h-100" style={{ objectFit: "cover" }} />
                                                        ) : (
                                                            <i className="mdi mdi-account fs-2 text-muted"></i>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-start">
                                                    <h5 className="mb-1 fw-bold">{selectedClient.firstName} {selectedClient.lastName}</h5>
                                                    <span className="text-muted">{activityName}</span>
                                                </div>
                                            </div>

                                            {(() => {
                                                // Calculate Progress
                                                const topics = currentEvaluation ? Object.values(currentEvaluation.levelsByTopicId || {}) : []

                                                // 1. Get Max Level Value from Config
                                                const maxLevel = levelsConfig.find(l => l.value === Math.max(...levelsConfig.map(x => x.value)))
                                                const maxVal = maxLevel ? Number(maxLevel.value) : 4

                                                // 2. Calculate Totals
                                                const totalPossible = topics.length * maxVal
                                                const currentTotal = topics.reduce((acc, t) => acc + Number(t.levelValue || 0), 0)

                                                // 3. Percentage
                                                const percentage = totalPossible > 0 ? Math.round((currentTotal / totalPossible) * 100) : 0

                                                return (
                                                    <div className="mb-4">
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="font-size-13 fw-bold" style={{ color: '#466a8f' }}>Progresso</span>
                                                            <span className="font-size-13 fw-bold" style={{ color: '#466a8f' }}>{percentage}%</span>
                                                        </div>
                                                        <div className="progress" style={{ height: '8px', backgroundColor: '#eff2f7' }}>
                                                            <div
                                                                className="progress-bar"
                                                                role="progressbar"
                                                                style={{ width: `${percentage}%`, backgroundColor: '#466a8f', borderRadius: '4px' }}
                                                                aria-valuenow={percentage}
                                                                aria-valuemin="0"
                                                                aria-valuemax="100"
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )
                                            })()}

                                            <div className="mb-4">
                                                {loadingEvaluations ? (
                                                    <div className="text-center py-2"><Spinner size="sm" color="primary" /> Carregando avaliações...</div>
                                                ) : evaluations.length > 0 ? (
                                                    <Input
                                                        type="select"
                                                        className="form-select"
                                                        value={selectedEvalId}
                                                        onChange={(e) => setSelectedEvalId(e.target.value)}
                                                    >
                                                        {evaluations.map(ev => {
                                                            let dateLabel = "Data desconhecida"
                                                            if (ev.createdAt?.seconds) {
                                                                dateLabel = format(new Date(ev.createdAt.seconds * 1000), "MMM yyyy", { locale: ptBR })
                                                            } else if (ev.startAt) {
                                                                dateLabel = format(new Date(ev.startAt), "MMM yyyy", { locale: ptBR })
                                                            }
                                                            // Uppercase first letter
                                                            dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

                                                            return (
                                                                <option key={ev.id} value={ev.id}>
                                                                    {dateLabel}
                                                                </option>
                                                            )
                                                        })}
                                                    </Input>
                                                ) : (
                                                    <div className="alert alert-warning text-center small mb-0">
                                                        Nenhuma avaliação encontrada para este aluno.
                                                    </div>
                                                )}
                                            </div>

                                            <hr className="my-4" />

                                            {selectedEvalId && currentEvaluation ? (
                                                <div className="results-list">
                                                    {(() => {
                                                        // 1. Group by Objective
                                                        const levelsMap = currentEvaluation.levelsByTopicId || {}
                                                        const objectivesMap = {}

                                                        Object.values(levelsMap).forEach(item => {
                                                            if (!objectivesMap[item.objectiveId]) {
                                                                objectivesMap[item.objectiveId] = {
                                                                    id: item.objectiveId,
                                                                    title: item.objectiveName,
                                                                    order: item.objectiveOrder || 999,
                                                                    topics: []
                                                                }
                                                            }
                                                            objectivesMap[item.objectiveId].topics.push(item)
                                                        })

                                                        // 2. Sort Objectives and Topics
                                                        const sortedObjectives = Object.values(objectivesMap).sort((a, b) => a.order - b.order)

                                                        sortedObjectives.forEach(obj => {
                                                            obj.topics.sort((a, b) => (a.topicOrder || 999) - (b.topicOrder || 999))
                                                        })

                                                        if (sortedObjectives.length === 0) {
                                                            return <p className="text-muted text-center">Nenhum dado encontrado nesta avaliação.</p>
                                                        }

                                                        // 3. Render
                                                        return sortedObjectives.map(obj => (
                                                            <div key={obj.id} className="mb-4">
                                                                <h5 className="font-size-14 text-primary fw-bold mb-3">
                                                                    {obj.order}. {obj.title}
                                                                </h5>
                                                                <div className="d-flex flex-column gap-3">
                                                                    {obj.topics.map(topic => (
                                                                        <div key={topic.topicId} className="d-flex align-items-center">
                                                                            <div className="bg-light p-3 rounded flex-grow-1 d-flex justify-content-between align-items-center">
                                                                                <div className="me-3">
                                                                                    <p className="mb-0 font-size-13 text-secondary">{topic.topicName}</p>
                                                                                </div>
                                                                                <div style={{ minWidth: '110px', textAlign: 'right' }}>
                                                                                    {renderLevel(topic.topicId)}
                                                                                </div>
                                                                            </div>
                                                                            {/* Improvement Indicator */}
                                                                            {checkImprovement(topic.topicId) && (
                                                                                <div className="ms-2 animate__animated animate__fadeInRight">
                                                                                    <i
                                                                                        className="mdi mdi-flash text-success font-size-22"
                                                                                        title="Evoluiu!"
                                                                                    ></i>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))
                                                    })()}
                                                </div>
                                            ) : (
                                                !loadingEvaluations && (
                                                    <div className="text-center text-muted py-4">
                                                        <i className="mdi mdi-information-outline fs-3 d-block mb-2"></i>
                                                        Selecione uma avaliação para ver os resultados.
                                                    </div>
                                                )
                                            )}

                                            <button
                                                className="btn btn-outline-secondary w-100 mt-4"
                                                onClick={handleClearSelection}
                                            >
                                                <i className="mdi mdi-arrow-left me-1"></i> Buscar outro aluno
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Kiosk
