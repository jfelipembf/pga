import React, { useEffect } from "react"
import { Card, CardBody, Row, Col } from "reactstrap"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"

// Components
import ReceivablesFilters from "./Components/ReceivablesFilters"
import ReceivablesTable from "./Components/ReceivablesTable"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"

// Hook
import { useReceivables } from "./Hooks/useReceivables"

const ReceivablesPage = ({ setBreadcrumbItems }) => {

    // Logic Hook
    const {
        data,
        loading,
        filters,
        updateFilter,
        refresh,
        clearFilters,
        // Client Search Props
        clientSearchText,
        setClientSearchText,
        clientCandidates,
        selectedClient,
        handleSelectClient,
        handleClearClient,
        // Cancellation
        cancelDialog,
        openCancelDialog,
        closeCancelDialog,
        handleConfirmCancel
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
                            onSearch={refresh}
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
                        <ReceivablesTable
                            data={data}
                            loading={loading}
                            onCancel={openCancelDialog}
                        />

                        {/* Confirm Dialog */}
                        <ConfirmDialog
                            isOpen={cancelDialog.open}
                            title="Cancelar Recebível"
                            message="Tem certeza que deseja cancelar este recebível? O status será alterado para Cancelado."
                            confirmText="Sim, Cancelar"
                            confirmColor="danger"
                            onConfirm={handleConfirmCancel}
                            onCancel={closeCancelDialog}
                            loading={cancelDialog.loading}
                        />
                    </CardBody>
                </Card>
            </Col>
        </Row>
    )
}

export default connect(null, { setBreadcrumbItems })(ReceivablesPage)
