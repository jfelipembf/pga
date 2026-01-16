import React from "react"
import PropTypes from "prop-types"
import { Card, CardBody, CardHeader, Badge } from "reactstrap"
import TestForm from "./TestForm"

const TestCard = ({ schedule, testEvent }) => {
    if (!testEvent) {
        return (
            <Card className="h-100 shadow-sm">
                <CardHeader className="bg-white border-bottom py-3">
                    <div className="text-center text-muted">
                        <i className="mdi mdi-calendar-remove me-2" />
                        Sem Teste Ativo
                    </div>
                </CardHeader>
                <CardBody className="pt-3">
                    <div className="text-center py-5">
                        <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                            <i className="mdi mdi-calendar-blank text-muted fs-4" />
                        </div>
                        <p className="text-muted mb-0">Não há nenhum evento de teste configurado para hoje.</p>
                    </div>
                </CardBody>
            </Card>
        )
    }

    if (!schedule) {
        return (
            <Card className="h-100 shadow-sm">
                <CardHeader className="bg-white border-bottom py-3">
                    <div className="text-center text-muted"> <i className="mdi mdi-cursor-default-click me-2" /> Selecione uma Turma </div>
                </CardHeader>
                <CardBody className="pt-3">
                    <div className="text-center py-5">
                        <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                            <i className="mdi mdi-school text-muted fs-4" />
                        </div>
                        <p className="text-muted mb-0">Selecione uma turma ao lado para lançar os resultados.</p>
                        <div className="mt-3 text-primary fw-bold">
                            Teste Ativo: {testEvent.title}
                        </div>
                    </div>
                </CardBody>
            </Card>
        )
    }

    // "Tempo" type -> Measure Time (Fixed Distance)
    // "Distancia" type -> Measure Distance (Fixed Time)
    const isDistanceFixed = testEvent.testType === 'tempo'

    return (
        <Card className="h-100 shadow-sm">
            <CardHeader className="bg-white border-bottom py-3">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 className="mb-0">{testEvent.title || "Teste"}</h5>
                        <div className="text-muted small mt-1">{schedule.activityName} - {schedule.startTime}</div>
                    </div>
                    {/* Badges Stacked Right */}
                    <div className="d-flex flex-column align-items-end gap-1">
                        <Badge color="primary" pill className="px-3">
                            {isDistanceFixed ? 'Distância Fixa' : 'Tempo Fixo'}
                        </Badge>
                        {testEvent.styles && (
                            <Badge color="info" className="text-dark">
                                {testEvent.styles}
                            </Badge>
                        )}
                    </div>
                </div>

                {testEvent.description && (
                    <div className="text-muted small mt-2">
                        {testEvent.description}
                    </div>
                )}

                <div className="mt-2 d-flex gap-2">
                    {isDistanceFixed && (
                        <Badge color="light" className="text-dark border">
                            Distância Alvo: {testEvent.distanceMeters ? `${testEvent.distanceMeters}m` : 'N/A'}
                        </Badge>
                    )}
                    {!isDistanceFixed && (
                        <Badge color="light" className="text-dark border">
                            Tempo Alvo: {testEvent.targetTime || 'N/A'}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardBody className="pt-3">
                <TestForm testEvent={testEvent} classId={schedule.idClass} />
            </CardBody>
        </Card>
    )
}

TestCard.propTypes = {
    testEvent: PropTypes.object,
    schedule: PropTypes.object
}

export default TestCard
