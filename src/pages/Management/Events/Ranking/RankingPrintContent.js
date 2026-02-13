import React from "react"
import { Row, Col } from "reactstrap"
import logoIcon from "assets/images/logoIcon.png"


const RankingPrintContent = ({ rankingData = [], event = {}, gymName = "PGA Sistema" }) => {
    const generatedAt = new Date().toLocaleString("pt-BR")

    const testConfig = event?.testConfig || {}
    const isFixedTime = ['fixed-time', 'distance'].includes(testConfig.measureType)
    const testLabel = isFixedTime ? "Tempo Fixo" : "Distância Fixa"
    const referenceLabel = `${testConfig.referenceValue}${testConfig.unit}`
    const resultHeader = isFixedTime ? "Distância" : "Tempo"

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
        <div className="p-4 bg-white ranking-print-container" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', width: '100%', color: '#333' }}>
            {/* Header - Official Style */}
            <div className="text-center border-bottom pb-3 mb-4">
                <img src={logoIcon} alt="Logo" height="120" style={{ objectFit: "contain", marginBottom: '5px' }} />
                <h4 className="fw-bold mb-1 text-uppercase" style={{ letterSpacing: '1px' }}>{gymName}</h4>
                <h5 className="mb-2 text-primary fw-bold" style={{ fontSize: '1.4rem' }}>{event?.name || "Ranking de Performance"}</h5>
                <div className="badge bg-light text-dark border px-3 py-2 mb-2" style={{ fontSize: '0.9rem' }}>
                    <i className={`mdi ${isFixedTime ? 'mdi-timer-sand' : 'mdi-run-fast'} me-2 text-primary`}></i>
                    <strong>{testLabel}: </strong> {referenceLabel} — Meta: Medir {resultHeader}
                </div>
                <p className="small text-muted mb-0">Relatório Oficial de Resultados • Gerado em {generatedAt}</p>
            </div>

            {/* Results List */}
            {sortedGroupKeys.map(groupName => (
                <div key={groupName} className="mb-4 break-inside-avoid shadow-none border-0">
                    <div className="d-flex justify-content-between align-items-end border-bottom border-dark mb-2 pb-1">
                        <h6 className="fw-bold mb-0 text-uppercase">{groupName}</h6>
                    </div>

                    <div className="ps-2">
                        {/* Header Row */}
                        <Row className="fw-bold small text-uppercase mb-1" style={{ fontSize: '0.8rem' }}>
                            <Col xs="1" className="text-end">Col.</Col>
                            <Col xs="6">Nome</Col>
                            <Col xs="2" className="text-center">Idade</Col>
                            <Col xs="3" className="text-end">{resultHeader}</Col>
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

            <style>
                {`
                @media print {
                    @page { size: auto; margin: 15mm; }
                    
                    /* Ocultar ABSOLUTAMENTE TUDO no body */
                    body * {
                        visibility: hidden;
                    }

                    /* Mostrar APENAS o container do ranking e seus filhos */
                    .ranking-print-container, 
                    .ranking-print-container * {
                        visibility: visible;
                    }

                    /* Reposicionar o ranking no topo da página impressa */
                    .ranking-print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        margin: 0 !important;
                        visibility: visible !important;
                    }
                    
                    /* Ocultar elementos específicos que podem persistir */
                    .btn, .sidebar-enable, .vertical-menu, .footer, .header, .modal-backdrop {
                        display: none !important;
                    }
                }
                `}
            </style>
        </div>
    )
}

export default RankingPrintContent
