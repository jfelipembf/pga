import React, { useEffect, useState, useMemo } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Table, Row, Col, Input, Badge } from "reactstrap"
import { getTestResultsByEvent } from "../../../services/Tests/tests.service"
import { listClientsByIds } from "../../../services/Clients/clients.service"
import { getCategory, calculateAge, SWIMMING_CATEGORIES } from "../../../utils/swimmingCategories"
import RankingPrintContent from "./RankingPrint"

const RankingModal = ({ isOpen, toggle, eventId, eventTitle }) => {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)

    // Filters
    const [filterGender, setFilterGender] = useState("") // 'M', 'F', ''
    const [filterCategory, setFilterCategory] = useState("")

    useEffect(() => {
        if (isOpen && eventId) {
            fetchRanking()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, eventId])

    const fetchRanking = async () => {
        setLoading(true)
        try {
            // 1. Get Results
            const rawResults = await getTestResultsByEvent(eventId)

            if (rawResults.length === 0) {
                setResults([])
                setLoading(false)
                return
            }

            // 2. Get Clients Info
            const clientIds = [...new Set(rawResults.map(r => String(r.idClient).trim()))]
            const clients = await listClientsByIds(clientIds)

            // Normalize map keys
            const clientMap = new Map()
            clients.forEach(c => {
                clientMap.set(String(c.id).trim(), c)
            })

            // 3. Enrich Data
            const enriched = rawResults.map(r => {
                const clientId = String(r.idClient).trim()
                const client = clientMap.get(clientId)

                // Normalizing Gender
                let genderCode = "U"
                if (client?.gender) {
                    const g = String(client.gender).toUpperCase()
                    if (g.startsWith("M")) genderCode = "M"
                    if (g.startsWith("F")) genderCode = "F"
                }

                return {
                    ...r,
                    clientName: client?.name || "Desconhecido", // Fallback name
                    gender: genderCode,
                    birthDate: client?.birthDate,
                    age: calculateAge(client?.birthDate),
                    category: getCategory(client?.birthDate)
                }
            })

            // Debug log
            console.log("Enriched Ranking Data:", enriched)

            setResults(enriched)
        } catch (error) {
            console.error("Error fetching ranking:", error)
        } finally {
            setLoading(false)
        }
    }

    // Processed Ranking (Filter + Sort)
    const rankingData = useMemo(() => {
        let filtered = [...results]

        if (filterGender) {
            filtered = filtered.filter(r => (r.gender || "").toUpperCase() === filterGender)
        }
        if (filterCategory) {
            filtered = filtered.filter(r => r.category === filterCategory)
        }

        // Sort: 
        // If Type = 'tempo' -> Smaller is better (ASC)
        // If Type = 'distancia' -> Larger is better (DESC)
        // We check the first result to guess type, or use mixed logic
        const type = filtered[0]?.testType || 'tempo'

        filtered.sort((a, b) => {
            if (type === 'distancia') {
                return b.numericResult - a.numericResult
            }
            return a.numericResult - b.numericResult
        })

        return filtered.map((item, index) => ({ ...item, position: index + 1 }))
    }, [results, filterGender, filterCategory])

    const handlePrint = () => {
        window.print()
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" className="ranking-modal-print-fix">
            {/* Global Print Overrides for Modals */}
            <style>
                {`
                    @media print {
                        /* Hide the main App content so it doesn't print */
                        #root {
                            display: none !important;
                        }

                        /* Ensure the modal content takes over */
                        body, .modal, .modal-backdrop, .modal-content {
                            background: white !important;
                            border: none !important;
                            box-shadow: none !important;
                            position: static !important;
                            overflow: visible !important;
                        }
                        .modal-dialog {
                            margin: 0 !important;
                            max-width: 100% !important;
                            width: 100% !important;
                            padding: 0 !important;
                        }
                        .modal-header, .modal-footer {
                            display: none !important;
                        }
                        /* Allow the modal explicitly */
                        .modal.show {
                            display: block !important;
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                        }
                    }
                `}
            </style>

            <ModalHeader toggle={toggle} className="d-print-none">
                <i className="mdi mdi-trophy me-2 text-warning"></i>
                Ranking: {eventTitle}
            </ModalHeader>
            <ModalBody>
                {/* Filters - Hide on Print */}
                <Row className="mb-4 d-print-none">
                    <Col md={3}>
                        <label className="small text-muted">Sexo</label>
                        <Input type="select" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </Input>
                    </Col>
                    <Col md={3}>
                        <label className="small text-muted">Categoria</label>
                        <Input type="select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                            <option value="">Todas</option>
                            {SWIMMING_CATEGORIES.map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </Input>
                    </Col>
                    <Col className="d-flex align-items-end justify-content-end">
                        <Button color="success" onClick={handlePrint} disabled={rankingData.length === 0}>
                            <i className="mdi mdi-printer me-1"></i> Imprimir Ranking
                        </Button>
                    </Col>
                </Row>

                {/* Printable Content - Visible ONLY on Print (Overlay Mode) */}
                <div className="d-none d-print-block" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 'auto',
                    zIndex: 99999,
                    background: 'white',
                    padding: '0mm'
                }}>
                    <RankingPrintContent
                        rankingData={rankingData}
                        eventTitle={eventTitle}
                        gymName="PGA Sistema"
                    />
                </div>

                {/* On-Screen Table - Hide on Print */}
                <div className="bg-white d-print-none">
                    <Table className="align-middle table-nowrap table-hover">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: "70px" }}>Pos.</th>
                                <th>Atleta</th>
                                <th>Idade</th>
                                <th>Categoria</th>
                                <th className="text-end">Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-4">Carregando...</td></tr>
                            ) : rankingData.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-4">Nenhum resultado encontrado.</td></tr>
                            ) : (
                                rankingData.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            {row.position === 1 && <i className="mdi mdi-trophy text-warning font-size-18"></i>}
                                            {row.position === 2 && <i className="mdi mdi-trophy text-secondary font-size-18"></i>}
                                            {row.position === 3 && <i className="mdi mdi-trophy text-orange font-size-18"></i>}
                                            <span className="ms-2 fw-bold">{row.position}º</span>
                                        </td>
                                        <td>
                                            <h6 className="mb-0">{row.clientName}</h6>
                                            <small className="text-muted d-print-none">{row.gender === 'M' ? 'Masculino' : row.gender === 'F' ? 'Feminino' : ''}</small>
                                        </td>
                                        <td>{row.age} anos</td>
                                        <td><Badge color="info" className="badge-soft">{row.category}</Badge></td>
                                        <td className="text-end fw-bold font-size-15">
                                            {row.result}
                                            <small className="text-muted ms-1 font-size-11 font-weight-normal">
                                                {row.testType === 'distancia' ? 'm' : ''}
                                            </small>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </ModalBody>
            <ModalFooter className="d-print-none">
                <Button color="secondary" onClick={toggle}>Fechar</Button>
            </ModalFooter>
        </Modal>
    )
}

export default RankingModal
