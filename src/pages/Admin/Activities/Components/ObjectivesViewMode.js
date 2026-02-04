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
                    <ul className="mb-0">
                        {obj.topics.map((topic, tIndex) => (
                            <li key={topic.id} className="mb-1">
                                <span className="text-muted me-2">
                                    {index + 1}.{tIndex + 1}
                                </span>
                                {topic.description}
                            </li>
                        ))}
                        {obj.topics.length === 0 && (
                            <li className="text-muted">Sem tópicos cadastrados.</li>
                        )}
                    </ul>
                </div>
            ))}
        </div>
    )
}

export default React.memo(ObjectivesViewMode)
