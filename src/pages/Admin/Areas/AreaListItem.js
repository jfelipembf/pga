import React from "react"

export const AreaListItem = ({ area, active, onClick }) => {
    return (
        <div
            className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${active ? 'bg-light' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
        >
            <div className="flex-grow-1 overflow-hidden">
                <h5 className="font-size-14 text-truncate mb-1">{area.name}</h5>
                <p className="text-muted font-size-12 mb-0">
                    Capacidade: {area.capacity || 0} pessoas
                </p>
                <div className="mt-1">
                    <span className={`badge bg-${area.isActive ? 'success' : 'danger'} font-size-10`}>
                        {area.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
            </div>
            <div className="flex-shrink-0 ms-2">
                <i className={`mdi mdi-chevron-right font-size-18 ${active ? 'text-primary' : 'text-muted opacity-50'}`}></i>
            </div>
        </div>
    )
}
