import React from "react"
import { Badge } from "reactstrap"

export const AcquirerListItem = ({ acquirer, active, onClick }) => {
    return (
        <div
            className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${active ? 'bg-light' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
            <div className="flex-grow-1 overflow-hidden">
                <h5 className="font-size-14 text-truncate mb-1">{acquirer.name}</h5>
                <p className="text-muted font-size-12 mb-0 text-uppercase">
                    {acquirer.brand}
                </p>
            </div>

            <div className="text-end ms-2">
                {acquirer.isActive ? (
                    <Badge color="success" pill>Ativo</Badge>
                ) : (
                    <Badge color="danger" pill>Inativo</Badge>
                )}
            </div>
        </div>
    )
}
