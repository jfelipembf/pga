import React from "react"

export const RoleListItem = ({ role, active, onClick }) => {
    // Suporta tanto 'name' quanto 'label' (Firebase usa 'label')
    const displayName = role.name || role.label || 'Sem nome'
    
    return (
        <div
            className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${active ? 'bg-light' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
        >
            <div className="flex-grow-1 overflow-hidden">
                <h5 className="font-size-14 text-truncate mb-1">
                    {displayName}
                </h5>
                {role.description && (
                    <p className="text-muted font-size-12 mb-0 text-truncate">
                        {role.description}
                    </p>
                )}
                <div className="mt-1">
                    <span className={`badge bg-${role.isActive ? 'success' : 'danger'} font-size-10`}>
                        {role.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
            </div>
            <div className="flex-shrink-0 ms-2">
                <i className={`mdi mdi-chevron-right font-size-18 ${active ? 'text-primary' : 'text-muted opacity-50'}`}></i>
            </div>
        </div>
    )
}
