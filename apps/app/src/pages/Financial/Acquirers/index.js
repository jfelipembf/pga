import React, { useEffect } from "react"
import { Button, Col, Container, Row } from "reactstrap"
import { connect } from "react-redux"

import SideMenu from "components/Common/SideMenu"
import AcquirerForm from "./Components/AcquirerForm"
import { setBreadcrumbItems } from "../../../store/actions"
import PageLoader from "../../../components/Common/PageLoader"
import { BRAND_OPTIONS } from "./Constants/acquirersDefaults"
import { useAcquirersLogic } from "./Hooks/useAcquirersLogic"

const AcquirersPage = ({ setBreadcrumbItems }) => {
  const {
    isLoading,
    initialized,
    formState,
    setFormState,
    selectedId,
    handleSelect,
    handleDelete,
    handleNew,
    sideMenuItems,
    toggleActive,
    toggleBrand,
    toggleAnticipate,
    handleInstallmentChange,
    handleAddInstallment,
    handleRemoveInstallment,
    handleClear,
    handleSave
  } = useAcquirersLogic()

  useEffect(() => {
    const breadcrumbs = [
      { title: "Financeiro", link: "/financial" },
      { title: "Adquirentes", link: "/financial/acquirers" },
    ]
    setBreadcrumbItems("Adquirentes", breadcrumbs)
  }, [setBreadcrumbItems])

  if (isLoading('page') && !initialized) {
    return <PageLoader />
  }

  return (
    <Container fluid>
      <Row className="g-4">
        <Col lg="4">
          <SideMenu
            title="Adquirentes"
            description="Gerencie operadoras e suas taxas."
            items={sideMenuItems}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onEdit={handleSelect}
            emptyLabel="Nenhuma adquirente cadastrada."
            headerActions={
              <Button color="primary" size="sm" onClick={handleNew}>
                <i className="mdi mdi-plus" /> Nova
              </Button>
            }
          />
        </Col>

        <Col lg="8">
          <AcquirerForm
            value={formState}
            onChange={setFormState}
            onSave={handleSave}
            onClear={handleClear}
            onToggleActive={toggleActive}
            onToggleBrand={toggleBrand}
            onToggleAnticipate={toggleAnticipate}
            onInstallmentChange={handleInstallmentChange}
            onAddInstallment={handleAddInstallment}
            onRemoveInstallment={handleRemoveInstallment}
            brandOptions={BRAND_OPTIONS}
            saving={isLoading('save')}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(AcquirersPage)
