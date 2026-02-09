import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Input, Badge, Table } from "reactstrap"
import { TestResultService } from "../../../../services/Events/TestResultService"
import { useTenant } from "../../../../hooks/useTenant"
import RankingPrintContent from "./RankingPrintContent"
import PageLoader from "../../../../components/Common/PageLoader"

const RankingModal = ({ isOpen, toggle, event }) => {
    const { idTenant, idBranch } = useTenant()
    const [loading, setLoading] = useState(false)
    const [rankingData, setRankingData] = useState([])
    const [isPrinting, setIsPrinting] = useState(false)

    // Filters
    const [genderFilter, setGenderFilter] = useState("all")
    const [categoryFilter, setCategoryFilter] = useState("all")

    const loadRanking = useCallback(async () => {
        setLoading(true)
        try {
            const data = await TestResultService.getRanking(
                idTenant, idBranch,
                event.id,
                event.testConfig?.measureType
            )
            setRankingData(data)
        } catch (error) {
            console.error("Erro ao carregar ranking:", error)
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, event?.id, event?.testConfig?.measureType])

    useEffect(() => {
        if (isOpen && event) {
            loadRanking()
        }
    }, [isOpen, event, loadRanking])

    const categories = useMemo(() => {
        const cats = new Set(rankingData.map(r => r.category))
        return ["all", ...Array.from(cats)].sort()
    }, [rankingData])

    const filteredData = useMemo(() => {
        return rankingData.filter(r => {
            const matchGender = genderFilter === "all" || r.gender === genderFilter
            const matchCategory = categoryFilter === "all" || r.category === categoryFilter
            return matchGender && matchCategory
        })
    }, [rankingData, genderFilter, categoryFilter])

    const handlePrint = () => {
        setIsPrinting(true)
        setTimeout(() => {
            window.print()
            setIsPrinting(false)
        }, 500)
    }

    if (isPrinting) {
        return <RankingPrintContent
            rankingData={filteredData}
            event={event}
        />
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" scrollable>
            <ModalHeader toggle={toggle} className="bg-light">
                <div className="d-flex align-items-center gap-2">
                    <i className="mdi mdi-trophy text-warning fs-4"></i>
                    <div>
                        <div className="fw-bold">Ranking de Performance</div>
                        <div className="small text-muted fw-normal">{event?.name}</div>
                    </div>
                </div>
            </ModalHeader>
            <ModalBody className="p-0">
                {/* Filters */}
                <div className="p-3 border-bottom bg-white sticky-top shadow-sm">
                    <Row className="g-2">
                        <Col xs="6" md="4">
                            <label className="small fw-bold text-uppercase text-muted mb-1">Sexo</label>
                            <Input
                                type="select"
                                size="sm"
                                value={genderFilter}
                                onChange={(e) => setGenderFilter(e.target.value)}
                            >
                                <option value="all">Todos</option>
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                            </Input>
                        </Col>
                        <Col xs="6" md="4">
                            <label className="small fw-bold text-uppercase text-muted mb-1">Categoria (Idade)</label>
                            <Input
                                type="select"
                                size="sm"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat === "all" ? "Todas" : cat}</option>
                                ))}
                            </Input>
                        </Col>
                        <Col xs="12" md="4" className="d-flex align-items-end">
                            <Button color="primary" size="sm" block onClick={loadRanking} disabled={loading}>
                                <i className="mdi mdi-refresh me-1"></i> Atualizar
                            </Button>
                        </Col>
                    </Row>
                </div>

                {loading ? (
                    <div className="py-5"><PageLoader /></div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="mdi mdi-account-off-outline fs-1 opacity-25 d-block mb-3"></i>
                        Nenhum resultado encontrado para este filtro.
                    </div>
                ) : (
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="text-center" style={{ width: '60px' }}>#</th>
                                <th>Atleta</th>
                                <th className="text-center">Idade</th>
                                <th>Categoria</th>
                                <th className="text-end">Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row, idx) => (
                                <tr key={row.id}>
                                    <td className="text-center">
                                        {idx === 0 ? <Badge color="warning"><i className="mdi mdi-trophy"></i> 1º</Badge> :
                                            idx === 1 ? <Badge color="secondary">2º</Badge> :
                                                idx === 2 ? <Badge color="bronze" style={{ backgroundColor: '#cd7f32', color: 'white' }}>3º</Badge> :
                                                    <span className="text-muted fw-bold">{idx + 1}º</span>}
                                    </td>
                                    <td>
                                        <div className="fw-bold text-dark">{row.clientName}</div>
                                        <small className="text-muted text-uppercase">{row.gender === 'M' ? 'Masculino' : 'Feminino'}</small>
                                    </td>
                                    <td className="text-center">{row.age}</td>
                                    <td>{row.category}</td>
                                    <td className="text-end">
                                        <span className="fw-bold fs-5 text-primary">{row.result}</span>
                                        <small className="ms-1 text-muted text-uppercase">{row.testType === 'distancia' ? 'm' : ''}</small>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </ModalBody>
            <ModalFooter className="bg-light">
                <div className="flex-grow-1 small text-muted">
                    <i className="mdi mdi-information-outline me-1"></i>
                    {filteredData.length} atleta(s) listado(s) no ranking atual.
                </div>
                <Button color="secondary" outline onClick={toggle}>Fechar</Button>
                <Button color="primary" onClick={handlePrint} disabled={filteredData.length === 0}>
                    <i className="mdi mdi-printer me-1"></i> Imprimir Ranking
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default RankingModal
