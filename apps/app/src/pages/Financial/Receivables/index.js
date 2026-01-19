import React, { useEffect } from "react"
import { Card, CardBody, Row, Col } from "reactstrap"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"

// Components
import ReceivablesFilters from "./Components/ReceivablesFilters"
import ReceivablesTable from "./Components/ReceivablesTable"

// Hook
import { useReceivables } from "./Hooks/useReceivables"

const ReceivablesPage = ({ setBreadcrumbItems }) => {

    // Logic Hook
    const {
        data,
        loading,
        filters,
        updateFilter,
        refresh, // Expose Refresh/Search
        clearFilters,
        // Client Search Props
        clientSearchText,
        setClientSearchText,
        clientCandidates,
        selectedClient,
        handleSelectClient,
        handleClearClient
    } = useReceivables()

    // Set Breadcrumbs via Redux (Standard Layout)
    useEffect(() => {
        const breadcrumbs = [
            { title: "Financeiro", link: "/financial/cashflow" },
            { title: "Contas a Receber", link: "/financial/receivables" },
        ]
        setBreadcrumbItems("Contas a Receber", breadcrumbs)
    }, [setBreadcrumbItems])

    return (
        <Row>
            <Col xs="12">
                <Card>
                    <CardBody>
                        {/* Filters */}
                        <ReceivablesFilters
                            filters={filters}
                            onUpdate={updateFilter}
                            onSearch={refresh} // Manual Trigger
                            onClear={clearFilters}
                            // Pass Search Props
                            clientSearchText={clientSearchText}
                            setClientSearchText={setClientSearchText}
                            clientCandidates={clientCandidates}
                            selectedClient={selectedClient}
                            handleSelectClient={handleSelectClient}
                            handleClearClient={handleClearClient}
                        />

                        {/* Table */}
                        <ReceivablesTable data={data} loading={loading} />
                    </CardBody>
                </Card>
            </Col>
        </Row>
    )
}

export default connect(null, { setBreadcrumbItems })(ReceivablesPage)
