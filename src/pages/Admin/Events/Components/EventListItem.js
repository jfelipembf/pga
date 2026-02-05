import React from "react"
import { Badge } from "reactstrap"
import moment from "moment"

export const EventListItem = ({ event, isSelected, onClick }) => {
    const isFinished = moment().isAfter(moment(event.endDate)) || event.status === 'finished'

    return (
        <div
            className={`p-3 border-bottom cursor-pointer transition-all ${isSelected ? 'bg-soft-primary border-primary border-start' : 'bg-white'}`}
            onClick={onClick}
            style={{ borderStartWidth: isSelected ? '4px' : '0' }}
        >
            <div className="d-flex justify-content-between align-items-start">
                <h6 className={`mb-1 text-truncate ${isSelected ? 'text-primary fw-bold' : ''}`} style={{ maxWidth: '180px' }}>
                    {event.name}
                </h6>
                <Badge color={isFinished ? 'secondary' : 'success'}>
                    {isFinished ? 'Finalizado' : 'Ativo'}
                </Badge>
            </div>
            <div className="text-muted small d-flex align-items-center mb-1">
                <i className="mdi mdi-calendar-range me-1"></i>
                {moment(event.startDate).format('DD/MM')} - {moment(event.endDate).format('DD/MM/YYYY')}
            </div>
            <div className="d-flex gap-1">
                <Badge color="info" className="border" style={{ fontSize: '0.65rem' }}>
                    {event.type === 'evaluation' ? 'AVALIAÇÃO' : 'TESTE'}
                </Badge>
                {event.type === 'test' && (
                    <Badge color="warning" className="border" style={{ fontSize: '0.65rem' }}>
                        {(['fixed-time', 'distance'].includes(event.testConfig?.measureType)) ? 'TEMPO FIXO' : 'DIST. FIXA'}
                    </Badge>
                )}
            </div>
        </div>
    )
}
