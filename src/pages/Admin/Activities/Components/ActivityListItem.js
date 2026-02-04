import React from "react"

const ActivityListItem = ({ activity, isSelected, onClick }) => {
    return (
        <div
            className={`p-3 border-bottom cursor-pointer ${isSelected ? 'bg-light' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                        {activity.color && (
                            <div
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: activity.color
                                }}
                            />
                        )}
                        <h6 className="mb-1">{activity.name}</h6>
                    </div>
                    {activity.description && (
                        <p className="mb-0 small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                            {activity.description}
                        </p>
                    )}
                </div>
                <div className="text-end">
                    <span className={`badge bg-${activity.isActive ? 'success' : 'secondary'}`}>
                        {activity.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ActivityListItem
