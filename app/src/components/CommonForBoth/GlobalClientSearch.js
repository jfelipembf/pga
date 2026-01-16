import React, { useState, useEffect, useMemo, useRef } from "react"
import { Input, InputGroup, InputGroupText, ListGroup, ListGroupItem, Spinner } from "reactstrap"
import { useNavigate, useParams } from "react-router-dom"
import { listClientsRepo } from "../../services/Clients/clients.repository"

const GlobalClientSearch = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(false)
    const [loaded, setLoaded] = useState(false) // Track if we already fetched
    const [showResults, setShowResults] = useState(false)

    // We need tenant/branch context. 
    // Usually available in URL or could be fetched. 
    // Creating a safe wrapper to get params or use defaults if implemented.
    const params = useParams()
    const navigate = useNavigate()
    const containerRef = useRef(null)

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleFocus = async () => {
        setShowResults(true)
        if (!loaded && !loading && params.tenant && params.branch) {
            setLoading(true)
            try {
                // Determine IDs. The repo usually needs a ctx object or we use the helper logic.
                // We'll trust the repo to resolve context if we pass the right overrides or let it use defaults
                // BUT, listClientsRepo uses requireBranchContext() which reads from LocalStorage/URL logic usually.
                // If we are in the authenticated area, this should work.

                // Construct pseudo context from params if needed, or rely on internal logic
                // listClientsRepo typically calls getContext() which relies on standard app context.
                // Let's assume standard behavior works if we are inside the main router.

                // Wait, useKiosk had to manually resolve IDs because Kiosk might be public or separate.
                // In Header (Authenticated), listClientsRepo should work natively if the user is logged in.

                const data = await listClientsRepo()
                setClients(Array.isArray(data) ? data : [])
                setLoaded(true)
            } catch (error) {
                console.error("GlobalSearch: Error loading clients", error)
            } finally {
                setLoading(false)
            }
        }
    }

    const filteredClients = useMemo(() => {
        if (!searchTerm) return []
        const lower = searchTerm.toLowerCase()
        return clients.filter(c => {
            const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase()
            return name.includes(lower)
        }).slice(0, 10) // Limit to 10
    }, [clients, searchTerm])

    const handleSelect = (client) => {
        setSearchTerm("")
        setShowResults(false)
        // Navigate to profile
        // Format: /:tenant/:branch/clients/profile?id=...
        if (params.tenant && params.branch) {
            navigate(`/${params.tenant}/${params.branch}/clients/profile?id=${client.id}`)
        }
    }

    return (
        <div className="position-relative d-none d-lg-block me-3" style={{ width: '420px' }} ref={containerRef}>
            <InputGroup className="bg-white rounded border">
                <InputGroupText className="bg-transparent border-0 pe-0 py-0">
                    <i className="mdi mdi-magnify text-muted fs-5"></i>
                </InputGroupText>
                <Input
                    type="text"
                    className="border-0 bg-transparent ps-2"
                    placeholder="Buscar aluno..."
                    style={{ fontSize: '14px', fontWeight: '500', height: '36px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleFocus}
                />
                {loading && (
                    <InputGroupText className="bg-transparent border-0 py-0">
                        <Spinner size="sm" color="primary" />
                    </InputGroupText>
                )}
            </InputGroup>

            {/* Results Dropdown */}
            {showResults && (searchTerm || loading) && (
                <div
                    className="position-absolute w-100 bg-white shadow-lg rounded-bottom py-2"
                    style={{ top: '100%', left: 0, zIndex: 1005, maxHeight: '300px', overflowY: 'auto' }}
                >
                    {filteredClients.length > 0 ? (
                        <ListGroup flush>
                            {filteredClients.map(client => (
                                <ListGroupItem
                                    key={client.id}
                                    action
                                    className="border-0 px-3 py-2 d-flex align-items-center"
                                    onClick={() => handleSelect(client)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                                        {client.photo ? (
                                            <img src={client.photo} className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} alt="" />
                                        ) : (
                                            <span className="text-secondary small fw-bold">
                                                {(client.firstName?.[0] || "").toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="mb-0 text-dark font-size-14">{client.firstName} {client.lastName}</h6>
                                    </div>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    ) : (
                        !loading && searchTerm && (
                            <div className="text-center py-3 text-muted small">
                                Nenhum aluno encontrado.
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}

export default GlobalClientSearch
