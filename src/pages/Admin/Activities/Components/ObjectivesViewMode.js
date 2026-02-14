import React from "react"
import { Badge } from "reactstrap"

/**
 * Componente de visualização (read-only) dos objectives e topics
 */
const ObjectivesViewMode = ({ objectives }) => {
    return (
        <div className="d-grid gap-3">
            {objectives.map((obj, index) => (
                <div key={obj.id} className="p-3 border rounded-3 bg-light">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <Badge color="primary" pill>
                            {String(index + 1).padStart(2, "0")}
                        </Badge>
                        <h6 className="mb-0">{obj.title}</h6>
                    </div>
                    <ul className="mb-0 list-unstyled">
                        {obj.topics.map((topic, tIndex) => (
                            <li key={topic.id} className="mb-2 d-flex justify-content-between align-items-center border-bottom pb-2 last-border-0">
                                <span>
                                    <span className="text-muted fw-bold me-2">
                                        {index + 1}.{tIndex + 1}
                                    </span>
                                    {topic.description}
                                </span>
                                {topic.isFundamental && (
                                    <Badge color="info" className="ms-2" title="Item fundamental para aprovação">
                                        Fundamental
                                    </Badge>
                                )}
                            </li>
                        ))}
                        {obj.topics.length === 0 && (
                            <li className="text-muted fst-italic">Sem tópicos cadastrados.</li>
                        )}
                    </ul>
                    <style>{`
                        .last-border-0:last-child { border-bottom: 0 !important; padding-bottom: 0 !important; margin-bottom: 0 !important; }
                    `}</style>
                </div>
            ))}
        </div>
    )
}

export default React.memo(ObjectivesViewMode)
