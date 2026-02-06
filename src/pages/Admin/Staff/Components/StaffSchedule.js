import React from 'react'
import { Row, Col, Card, CardBody, Spinner, Badge } from 'reactstrap'
import classNames from 'classnames'

const DAYS_OF_WEEK = {
    0: 'Domingo',
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado'
}

const StaffSchedule = ({ schedule = [], loading, activities = [], areas = [] }) => {
    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2 text-muted">Carregando agenda...</p>
            </div>
        )
    }

    if (!schedule.length) {
        return (
            <Card className="border-0 shadow-sm">
                <CardBody className="text-center py-5">
                    <div className="avatar-md bg-soft-primary text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                        <i className="mdi mdi-calendar-blank font-size-24" />
                    </div>
                    <h5 className="text-dark">Nenhuma turma encontrada</h5>
                    <p className="text-muted">Este colaborador não possui turmas vinculadas.</p>
                </CardBody>
            </Card>
        )
    }

    // Agrupar
    const groupedSchedule = schedule.reduce((acc, curr) => {
        const day = curr.weekday
        if (!acc[day]) acc[day] = []
        acc[day].push(curr)
        return acc
    }, {})

    // Ordenar
    Object.keys(groupedSchedule).forEach(day => {
        groupedSchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })

    const getActivity = (id) => activities.find(a => a.id === id)
    const getAreaName = (id) => areas.find(a => a.id === id)?.name || 'Área'

    return (
        <div className="staff-schedule animate__animated animate__fadeIn">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                    <div className="bg-soft-primary text-primary avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
                        <i className="mdi mdi-calendar-clock font-size-16" />
                    </div>
                    <h5 className="mb-0 font-size-15 fw-bold text-dark">Agenda de Turmas</h5>
                </div>
                <Badge color="soft-primary" className="font-size-12 px-3 py-2">
                    {schedule.length} Turmas Ativas
                </Badge>
            </div>

            <div className="schedule-horizontal-scroll">
                <div className="schedule-grid">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => {
                        const dayClasses = groupedSchedule[day] || []

                        return (
                            <div key={day} className="day-column">
                                <div className="day-header mb-3">
                                    <h6 className={classNames("mb-0 fw-bold text-uppercase font-size-11", {
                                        "text-primary": dayClasses.length > 0,
                                        "text-muted": dayClasses.length === 0
                                    })}>
                                        {DAYS_OF_WEEK[day]}
                                    </h6>
                                    {dayClasses.length > 0 && (
                                        <Badge color="soft-primary" pill className="font-size-10">
                                            {dayClasses.length}
                                        </Badge>
                                    )}
                                </div>

                                <div className="classes-list d-flex flex-column gap-3">
                                    {dayClasses.length > 0 ? (
                                        dayClasses.map((item, idx) => {
                                            const activity = getActivity(item.idActivity)
                                            const color = activity?.color || activity?.colorHex || '#5b73e8'

                                            return (
                                                <div key={idx} className="grade-event">
                                                    <div className="grade-event__top">
                                                        <span className="grade-event__time text-primary">
                                                            {item.startTime}
                                                        </span>
                                                        <span className="grade-event__capacity">
                                                            {item.maxCapacity}
                                                        </span>
                                                    </div>

                                                    <div className="grade-event__title text-dark">
                                                        {activity?.name || 'Atividade'}
                                                    </div>

                                                    <div className="grade-event__details">
                                                        <div className="grade-event__meta">
                                                            <i className="mdi mdi-map-marker-outline me-1 text-info"></i>
                                                            {getAreaName(item.idArea)}
                                                        </div>
                                                    </div>

                                                    <svg className="grade-event__wave" viewBox="0 0 120 25" preserveAspectRatio="none">
                                                        <path d="M0,20 Q30,22 60,18 T120,15 L120,25 L0,25 Z" fill={color} fillOpacity="0.1" />
                                                        <path d="M0,15 Q20,18 40,14 T80,12 Q100,10 120,13 L120,25 L0,25 Z" fill={color} fillOpacity="0.05" />
                                                    </svg>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="no-classes">
                                            <span>Sem aulas</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default StaffSchedule
