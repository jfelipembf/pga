import React from "react"
import { Row, Col } from "reactstrap"
import logoIcon from "assets/images/logoIcon.png"


const RankingPrintContent = ({ rankingData = [], eventTitle = "", eventDate = "", gymName = "PGA Sistema" }) => {
    const generatedAt = new Date().toLocaleString("pt-BR")

    // Grouping Logic
    const groups = rankingData.reduce((acc, curr) => {
        const key = `${curr.category} - ${curr.gender === 'M' ? 'Masculino' : curr.gender === 'F' ? 'Feminino' : 'Misto'} `
        if (!acc[key]) acc[key] = []
        acc[key].push(curr)
        return acc
    }, {})

    // Sort groups alphabetically
    const sortedGroupKeys = Object.keys(groups).sort()

    return (
        <div className="p-4 bg-white" style={{ fontFamily: '"Courier New", Courier, monospace', width: '100%' }}>
            {/* Header - Official Style */}
            <div className="text-center border-bottom pb-3 mb-4">
                <img src={logoIcon} alt="Logo" height="120" style={{ objectFit: "contain", marginBottom: '5px' }} />
                <h4 className="fw-bold mb-1 text-uppercase">{gymName}</h4>
                <h5 className="mb-1">{eventTitle}</h5>
                <p className="small mb-0">Relatório de Resultados - Gerado em {generatedAt}</p>
            </div>

            {/* Results List */}
            {sortedGroupKeys.map(groupName => (
                <div key={groupName} className="mb-4 break-inside-avoid">
                    <div className="d-flex justify-content-between align-items-end border-bottom border-dark mb-2 pb-1">
                        <h6 className="fw-bold mb-0 text-uppercase">{groupName}</h6>
                    </div>

                    <div className="ps-2">
                        {/* Header Row */}
                        <Row className="fw-bold small text-uppercase mb-1" style={{ fontSize: '0.8rem' }}>
                            <Col xs="1" className="text-end">Col.</Col>
                            <Col xs="6">Nome</Col>
                            <Col xs="2" className="text-center">Idade</Col>
                            <Col xs="3" className="text-end">Tempo/Dist.</Col>
                        </Row>

                        {/* Rows */}
                        {groups[groupName].map((row, idx) => (
                            <Row key={row.id} className="mb-1" style={{ fontSize: '0.9rem', borderBottom: '1px dashed #eee' }}>
                                <Col xs="1" className="text-end fw-bold">{idx + 1}º</Col>
                                <Col xs="6" className="text-truncate">{row.clientName}</Col>
                                <Col xs="2" className="text-center">{row.age}a</Col>
                                <Col xs="3" className="text-end fw-bold">
                                    {row.result}
                                    <span className="small ms-1 text-muted">
                                        {row.testType === 'distancia' ? 'm' : ''}
                                    </span>
                                </Col>
                            </Row>
                        ))}
                    </div>
                </div>
            ))}

            {rankingData.length === 0 && (
                <div className="text-center py-5 text-muted">
                    Nenhum resultado registrado para este evento.
                </div>
            )}

            {/* Footer */}
            <div className="mt-5 pt-4 text-center small text-muted border-top">
                <p>Resultados Oficiais</p>
                <div className="mt-4 d-flex justify-content-end align-items-center">
                    <small className="text-muted me-2">Powered by</small>
                    <img src={logoIcon} alt="Swim" height="40" style={{ opacity: 0.6 }} />
                </div>
            </div>
        </div>
    )
}

export default RankingPrintContent
