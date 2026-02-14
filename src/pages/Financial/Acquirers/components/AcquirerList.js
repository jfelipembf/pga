
import React from "react"
import { AcquirerItem } from "./AcquirerItem"
import PageLoader from "../../../../components/Common/PageLoader"

export const AcquirerList = ({ acquirers, loading, selectedId, onSelect }) => {
    return (
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && acquirers.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : acquirers.length === 0 ? (
                <div className="p-3 text-center text-muted small">
                    <i className="mdi mdi-credit-card-off-outline d-block font-size-24 mb-2"></i>
                    Nenhuma adquirente cadastrada.
                </div>
            ) : null}
            {acquirers.map(item => (
                <AcquirerItem
                    key={item.id}
                    acquirer={item}
                    active={selectedId === item.id}
                    onClick={() => onSelect(item)}
                />
            ))}
        </div>
    )
}
