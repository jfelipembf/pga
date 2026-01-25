import React, { useEffect } from "react"
import { connect } from "react-redux"
import { Button, Card, CardBody, CardHeader, Col, Container, Row, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"

import StaffProfileForm from "./StaffProfileForm"
import StaffClasses from "./StaffClasses"
import StatusBadge from "../../../components/Common/StatusBadge"
import { setBreadcrumbItems } from "../../../store/actions"
import directoryBg from "../../../assets/images/directory-bg.jpg"
import PageLoader from "../../../components/Common/PageLoader"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"

import { TABS } from "../Constants/index"
import { MOCK_CLASSES as mockClasses } from "../Constants/StaffDefaults"
import { useStaffProfile } from "../Hooks/useStaffProfile"
import { useStaffActions } from "../Hooks/useStaffActions"

const StaffProfile = ({ setBreadcrumbItems }) => {
  const {
    staffId,
    formData,
    setFormData,
    passwordForm,
    setPasswordForm,
    updateField,
    updatePasswordField,
    roles,
    activeTab,
    setActiveTab,
    menuOpen,
    setMenuOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    isLoading,
    withLoading,
    profile
  } = useStaffProfile()

  const {
    handleSave,
    handleDeleteStaff,
    uploading
  } = useStaffActions({
    staffId,
    formData,
    setFormData,
    passwordForm,
    setPasswordForm,
    withLoading
  })

  useEffect(() => {
    const breadcrumbs = [
      { title: "Colaboradores", link: "/Staff/list" },
      { title: "Perfil", link: "/Staff/profile" },
    ]
    setBreadcrumbItems("Perfil do colaborador", breadcrumbs)
  }, [setBreadcrumbItems])

  if (isLoading('page') || !formData || !profile) {
    return <PageLoader />
  }

  // View-specific helper for profile cover
  const profileWithCover = { ...profile, cover: directoryBg }

  return (
    <Container fluid className="client-profile Staff-profile">
      <div
        className="client-profile__hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%), url(${profileWithCover.cover})`,
        }}
      >
        <div className="client-profile__content">
          <div className="d-flex align-items-center gap-3">
            <div className="client-profile__avatar-wrapper">
              <div
                className="client-profile__avatar"
                style={{ backgroundImage: `url("${profileWithCover.photo}")` }}
              >
              </div>
              <label htmlFor="collabAvatar" className="client-profile__camera">
                <i className="mdi mdi-camera" />
              </label>
              <input
                type="file"
                id="collabAvatar"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  // Set preview
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    updateField("photo", reader.result) // Preview
                    updateField("avatarFile", file) // File to upload
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </div>
            <div className="text-white">
              <h3 className="mb-1 text-truncate">{profileWithCover.name}</h3>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <StatusBadge status={profileWithCover.status} type="common" className="px-3 py-2" />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Button color="light" className="d-flex align-items-center gap-2" href={`mailto:${formData.email}`}>
              <i className="mdi mdi-email-outline" />
              Contatar
            </Button>
            <ButtonLoader color="primary" className="d-flex align-items-center gap-2" onClick={handleSave} loading={isLoading('save') || uploading}>
              <i className="mdi mdi-content-save" />
              Salvar
            </ButtonLoader>

            <div className="ms-2 border-start ps-3">
              <Dropdown isOpen={menuOpen} toggle={() => setMenuOpen(!menuOpen)}>
                <DropdownToggle color="transparent" className="p-0 border-0 text-white">
                  <i className="mdi mdi-dots-vertical fs-4 text-white" />
                </DropdownToggle>
                <DropdownMenu end>
                  <DropdownItem onClick={() => setDeleteModalOpen(true)} className="text-danger">
                    <i className="mdi mdi-trash-can-outline me-2" />
                    Excluir Colaborador
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>

        <div className="client-profile__tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              className={`client-profile__tab ${activeTab === tab ? "client-profile__tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Excluir Colaborador"
        description={`Tem certeza que deseja excluir ${profileWithCover.name}? Esta ação não pode ser desfeita imediatamente (soft delete) e removerá o acesso do usuário.`}
        confirmColor="danger"
        confirmText="Sim, excluir"
        onConfirm={handleDeleteStaff}
        onCancel={() => setDeleteModalOpen(false)}
        loading={isLoading('delete')}
      />

      <Row className="g-4 mt-3">
        {activeTab === "Perfil" && (
          <Col md="12">
            <Card className="shadow-sm">
              <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h5 className="mb-0">Dados do colaborador</h5>
                  <p className="text-muted mb-0 small">Informações de contato e acesso.</p>
                </div>
              </CardHeader>
              <CardBody>
                <StaffProfileForm
                  value={formData}
                  onChange={updateField}
                  passwordValue={passwordForm}
                  onPasswordChange={updatePasswordField}
                  onSave={handleSave}
                  saving={isLoading('save') || uploading}
                  roles={roles}
                />
              </CardBody>
            </Card>
          </Col>
        )}

        {activeTab === "Minhas turmas" && (
          <Col md="12">
            <StaffClasses classes={mockClasses} />
          </Col>
        )}
      </Row>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(StaffProfile)
