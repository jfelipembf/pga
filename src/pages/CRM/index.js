import React, { useState, useEffect, useCallback } from "react"
import { Row, Col } from "reactstrap"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../store/actions"
import { CRMFilters } from "./Components/CRMFilters"
import { CRMResults } from "./Components/CRMResults"
import { CRMService } from "../../services/Clients/CRMService"

import { useTenant } from "../../hooks/useTenant"
import { ActivityService } from "../../services/Admin/ActivityService"
import { StaffService } from "../../services/Admin/StaffService"
import { ContractService } from "../../services/Financial/ContractService"

const CRMPage = ({ setBreadcrumbItems }) => {
    document.title = "CRM e Relatórios | PGA Admin"
    const { idTenant, idBranch, isReady } = useTenant()

    const [filters, setFilters] = useState({})
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState([])
    const [activities, setActivities] = useState([])
    const [staff, setStaff] = useState([])
    const [availableContracts, setAvailableContracts] = useState([])

    const loadAuxiliaryData = useCallback(async () => {
        try {
            const [activitiesData, staffData, contractsData] = await Promise.all([
                ActivityService.listAll(idTenant, idBranch),
                StaffService.listAll(idTenant, idBranch),
                ContractService.listAllContracts(idTenant, idBranch)
            ])
            setActivities(activitiesData)
            setStaff(staffData)
            setAvailableContracts(contractsData)
        } catch (error) {
            console.error("Erro ao carregar dados auxiliares do CRM:", error)
        }
    }, [idTenant, idBranch])

    const fetchClients = useCallback(async (currentFilters) => {
        try {
            setLoading(true)
            const results = await CRMService.listFilteredClients(idTenant, idBranch, currentFilters)
            setClients(results)
        } catch (error) {
            console.error("Erro ao buscar clientes CRM:", error)
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch])

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Clientes", link: "/clients" },
            { title: "CRM e Relatórios", link: "/crm" },
        ]
        setBreadcrumbItems("CRM e Relatórios", breadcrumbItems)

        // Carregar dados iniciais e auxiliares apenas quando o contexto do tenant estiver pronto
        if (isReady) {
            fetchClients(filters)
            loadAuxiliaryData()
        }
    }, [isReady, setBreadcrumbItems, fetchClients, loadAuxiliaryData, filters])

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters)
    }

    const handleApplyFilters = () => {
        fetchClients(filters)
    }

    return (
        <React.Fragment>
            <Row>
                {/* Coluna da Esquerda: Filtros */}
                <Col lg={3}>
                    <CRMFilters
                        filters={filters}
                        onChange={handleFilterChange}
                        onApply={handleApplyFilters}
                        activities={activities}
                        staff={staff}
                        availableContracts={availableContracts}
                    />
                </Col>

                {/* Coluna da Direita: Resultados */}
                <Col lg={9}>
                    <CRMResults
                        clients={clients}
                        loading={loading}
                    />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(CRMPage)
