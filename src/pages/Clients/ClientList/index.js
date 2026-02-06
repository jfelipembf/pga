import React, { useEffect } from "react"
import { Row, Col } from "reactstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"

// Components
import BasicTable from "../../../components/Common/BasicTable"
import ClientAddModal from "./ClientAddModal"
import PageLoader from "../../../components/Common/PageLoader"

// Hooks
import { useClientList } from "../hooks/useClientList"
import { useClientTableColumns } from "../hooks/useClientTableColumns"

// Store Actions
import { setBreadcrumbItems } from "../../../store/actions"

const ClientsList = ({ setBreadcrumbItems }) => {
    document.title = "Clientes | PGA Admin"
    const navigate = useNavigate()

    const {
        clients,
        loading: loadingPage,
        refreshClients,
        modalOpen,
        setModalOpen,
        handleRowClick
    } = useClientList()

    const columns = useClientTableColumns()

    // Setup Breadcrumb
    useEffect(() => {
        const breadcrumbItems = [
            { title: "Dashboard", link: "#" },
            { title: "Clientes", link: "#" }
        ]
        setBreadcrumbItems("Listagem de Clientes", breadcrumbItems)
    }, [setBreadcrumbItems])

    if (loadingPage && !clients.length) {
        return <PageLoader />
    }

    return (
        <React.Fragment>
            <Row>
                <Col xl={12}>
                    <BasicTable
                        columns={columns}
                        data={clients}
                        searchKeys={["firstName", "lastName", "email", "phone", "lifecycleStatus"]}
                        searchPlaceholder="Buscar por nome, email ou telefone..."
                        onNewClick={() => setModalOpen(true)}
                        onRowClick={(client) => handleRowClick(client, navigate)}
                        loading={loadingPage}
                        paginationPosition="bottom"
                    />
                </Col>
            </Row>

            {/* Modal de Criação */}
            <ClientAddModal
                isOpen={modalOpen}
                toggle={() => setModalOpen(!modalOpen)}
                onClientAdded={refreshClients}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(ClientsList)
