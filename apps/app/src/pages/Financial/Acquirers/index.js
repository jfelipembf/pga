import React, { useEffect } from "react"
import { Button, Col, Container, Row } from "reactstrap"
import { connect } from "react-redux"

import SideMenu from "components/Common/SideMenu"
import AcquirerForm from "./Components/AcquirerForm"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
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
    requestDelete,
    cancelDelete,
    isDeleteModalOpen,
    handleNew,
    sideMenuItems,
    toggleActive,
    toggleBrand,
    toggleAnticipate,
    handleInstallmentChange,
    handleAddInstallment,
    handleRemoveInstallment,
    handleClear,
    handleSave,
    // Brand Fees
    getBrandFeeState,
    initializeBrandFees,
    removeBrandFees,
    handleBrandFeeChange,
    handleBrandToggleAnticipate,
    handleBrandInstallmentChange,
    handleBrandAddInstallment,
    handleBrandRemoveInstallment
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
            onDelete={requestDelete}
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
            // Brand Fees Logic
            getBrandFeeState={getBrandFeeState}
            initializeBrandFees={initializeBrandFees}
            removeBrandFees={removeBrandFees}
            onBrandFeeChange={handleBrandFeeChange}
            onBrandToggleAnticipate={handleBrandToggleAnticipate}
            onBrandInstallmentChange={handleBrandInstallmentChange}
            onBrandAddInstallment={handleBrandAddInstallment}
            onBrandRemoveInstallment={handleBrandRemoveInstallment}
          />
        </Col>
      </Row>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Excluir Adquirente"
        message="Tem certeza que deseja excluir esta adquirente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmColor="danger"
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(AcquirersPage)
