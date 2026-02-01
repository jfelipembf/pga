import React, { useEffect } from "react"
import { Row, Col } from "reactstrap"
import { connect } from "react-redux"

// Components
import BasicTable from "../../../components/Common/BasicTable"
import ClientAddModal from "./ClientAddModal"

// Hooks
import { useClientList } from "../hooks/useClientList"
import { useClientListActions } from "../hooks/useClientListActions"
import { useClientTableColumns } from "../hooks/useClientTableColumns"

// Store Actions
import { setBreadcrumbItems } from "../../../store/actions"

const ClientsList = ({ setBreadcrumbItems }) => {
    document.title = "Clientes | Lexa Admin"

    const { clients, loading: loadingPage, refreshClients } = useClientList()

    const columns = useClientTableColumns()

    const {
        modalOpen,
        setModalOpen,
        handleRowClick,
    } = useClientListActions({ setClients: () => { } })

    // Setup Breadcrumb
    useEffect(() => {
        const breadcrumbItems = [
            { title: "Dashboard", link: "#" },
            { title: "Clientes", link: "#" }
        ]
        setBreadcrumbItems("Listagem de Clientes", breadcrumbItems)
    }, [setBreadcrumbItems])

    return (
        <React.Fragment>
            <Row>
                <Col xl={12}>
                    <BasicTable
                        columns={columns}
                        data={clients}
                        searchKeys={["firstName", "lastName", "email", "phone", "status"]}
                        searchPlaceholder="Buscar por nome, email ou telefone..."
                        onNewClick={() => setModalOpen(true)}
                        onRowClick={handleRowClick}
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
