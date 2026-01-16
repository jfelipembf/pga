// Import ClientAddModal
import ClientAddModal from "./ClientAddModal"
import React, { useEffect } from "react"
import { Row, Col } from "reactstrap"
import { connect } from "react-redux"

import BasicTable from "../../../components/Common/BasicTable"
// BasicModalForm removed or kept if needed by other things not shown here
import PageLoader from "../../../components/Common/PageLoader"
import { setBreadcrumbItems } from "../../../store/actions"

import { useClientList } from "../Hooks/useClientList"
import { useClientListActions } from "../Hooks/useClientListActions"
import { useClientTableColumns } from "../Hooks/useClientTableColumns"
import ClientExtraFields from "./ClientExtraFields"

const ClientsList = ({ setBreadcrumbItems }) => {
  const { clients, setClients, contractsByClient, loading: loadingPage } = useClientList()

  const {
    modalOpen,
    setModalOpen,
    handleModalSubmit,
    handleRowClick,
    profilePath,
    uploading,
    isLoading: isSubmitting
  } = useClientListActions({ setClients })

  const columns = useClientTableColumns({ contractsByClient, profilePath })

  useEffect(() => {
    const breadcrumbItems = [{ title: "Clientes", link: "/clients/list" }]
    setBreadcrumbItems("Clientes", breadcrumbItems)
  }, [setBreadcrumbItems])

  return (
    <Row>
      <Col>
        {loadingPage && !clients.length ? (
          <PageLoader />
        ) : (
          <>
            <BasicTable
              columns={columns}
              data={clients}
              searchKeys={["name", "email", "phone", "status"]}
              searchPlaceholder="Buscar clientes..."
              onNewClick={() => setModalOpen(true)}
              onRowClick={handleRowClick}
              loading={loadingPage}
            />
            <ClientAddModal
              isOpen={modalOpen}
              toggle={() => setModalOpen(false)}
              onSubmit={handleModalSubmit}
              renderExtra={(props) => <ClientExtraFields {...props} />}
              submitting={isSubmitting || uploading}
            />
          </>
        )}
      </Col>
    </Row>
  )
}

export default connect(null, { setBreadcrumbItems })(ClientsList)
