import React from "react"
import { connect } from "react-redux"
import { Badge, Button, Col, Container, Row } from "reactstrap"
import { useLocation } from "react-router-dom"

import { setBreadcrumbItems } from "../../../store/actions"
import ClientFinancial from "./ClientFinancial"
import ClientContracts from "./ClientContracts"
import ClientEvaluation from "./ClientEvaluation"
import ClientTests from "./ClientTests"
import ClientPresence from "./ClientPresence"
import ClientSummary from "./ClientSummary"
import ClientProfileForm from "./ClientProfileForm"
import ClientEnrollments from "./ClientEnrollments"

import { useClientData } from "../../../hooks/useClientData"
import StatusBadge from "../../../components/Common/StatusBadge"
import PageLoader from "../../../components/Common/PageLoader"
import ButtonLoader from "../../../components/Common/ButtonLoader"

import { PROFILE_TABS as TABS } from "../Constants/defaults"
import { useProfileLogic } from "../Hooks/useProfileLogic"
import { useProfileActions } from "../Hooks/useProfileActions"

const ClientProfile = ({ setBreadcrumbItems }) => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const clientId = searchParams.get("id")

  const {
    client,
    contracts,
    enrollments,
    financial,
    evaluations,
    tests,
    presences,
    attendanceMonthly,
    loading: loadingClient,
    refetch,
  } = useClientData(clientId)

  const {
    tenant,
    branch,
    formData,
    setFormData,
    setAvatarPreview,
    activeTab,
    setActiveTab,
    enrollmentsState,
    setEnrollmentsState,
    updateField,
    primaryContract,
    totalDebt,
    formatCurrency,
    contractStatusValue,
    profile
  } = useProfileLogic({
    client,
    contracts,
    financial,
    enrollments,
    setBreadcrumbItems
  })

  const {
    handleAvatarChange,
    handleSave,
    handleRemoveEnrollment,
    isLoading,
    uploading,
    navigate
  } = useProfileActions({
    clientId,
    formData,
    setFormData,
    setAvatarPreview,
    setEnrollmentsState,
    updateField,
    profileName: profile.name
  })

  return (
    <Container fluid className="client-profile">
      {loadingClient ? (
        <PageLoader />
      ) : (
        <>
          <div
            className="client-profile__hero"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) 60%), url(${profile.cover})`,
            }}
          >
            <div className="client-profile__content">
              <div className="d-flex align-items-center gap-3">
                <div className="client-profile__avatar-wrapper">
                  <div
                    className="client-profile__avatar"
                    style={{ backgroundImage: `url(${profile.photo})` }}
                  />
                  <label htmlFor="clientAvatar" className="client-profile__camera">
                    <i className="mdi mdi-camera" />
                  </label>
                  <input
                    type="file"
                    id="clientAvatar"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="text-white">
                  <h3 className="mb-1 text-truncate">{profile.name}</h3>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-semibold">ID: {profile.id}</span>
                    {contractStatusValue ? (
                      <StatusBadge status={primaryContract.status} type="contract" />
                    ) : (
                      <Badge color={profile.statusColor} pill className="px-3 py-2">
                        {profile.status}
                      </Badge>
                    )}
                  </div>
                  {totalDebt > 0 && (
                    <div className="mt-2">
                      <Badge color="danger" className="px-3 py-1" style={{ fontSize: "0.75rem" }}>
                        <i className="mdi mdi-alert-circle-outline me-1"></i>
                        Saldo devedor: {formatCurrency(totalDebt)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <Button
                  color="success"
                  className="d-flex align-items-center gap-2"
                  onClick={() =>
                    navigate(`/${tenant}/${branch}/clients/sales?idClient=${clientId || ""}`)
                  }
                >
                  <i className="mdi mdi-cart" />
                  Nova venda
                </Button>
                <ButtonLoader
                  color="light"
                  className="d-flex align-items-center gap-2"
                  onClick={handleSave}
                  loading={isLoading('save') || uploading}
                >
                  <i className="mdi mdi-content-save" />
                  Salvar
                </ButtonLoader>
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

          <Row className="g-4 mt-3">
            {activeTab === "Perfil" && (
              <Col md="12">
                <ClientProfileForm value={formData} onChange={setFormData} />
              </Col>
            )}
            {activeTab === "Financeiro" && (
              <Col md="12">
                <ClientFinancial
                  financial={financial}
                  idClient={clientId}
                  clientName={profile.name} // Added
                  onRefresh={refetch}
                />
              </Col>
            )}
            {activeTab === "Matrículas" && (
              <Col md="12">
                <ClientEnrollments
                  client={client}
                  enrollments={enrollmentsState}
                  hasActiveContract={primaryContract?.status === "active"}
                  contractStatus={primaryContract?.status}
                  onEnroll={
                    clientId
                      ? () => {
                        const match = location.pathname.match(/^\/[^/]+\/[^/]+/)
                        const prefix = match ? match[0] : ""
                        const isExperimental = !(primaryContract?.status === "active")
                        const url = `${prefix}/clients/enroll?idClient=${clientId}${isExperimental ? "&type=experimental" : ""}`
                        navigate(url)
                      }
                      : undefined
                  }
                  onRemove={handleRemoveEnrollment}
                  removing={isLoading('remove')}
                />
              </Col>
            )}
            {activeTab === "Contratos" && (
              <Col md="12">
                <ClientContracts
                  contracts={contracts}
                  idClient={clientId}
                  clientName={profile.name} // Added
                  onRefresh={refetch}
                />
              </Col>
            )}
            {activeTab === "Avaliação" && (
              <Col md="12">
                <ClientEvaluation clientId={clientId} />
              </Col>
            )}
            {activeTab === "Testes" && (
              <Col md="12">
                <ClientTests tests={tests} />
              </Col>
            )}
            {activeTab === "Resumo" && (
              <Col md="12">
                <ClientSummary
                  onOpenTab={tab => setActiveTab(tab)}
                  client={client}
                  financial={financial}
                  contracts={contracts}
                  enrollments={enrollments}
                  evaluations={evaluations}
                  tests={tests}
                  presences={presences}
                  attendanceMonthly={attendanceMonthly}
                />
              </Col>
            )}
            {activeTab === "Presenças" && (
              <Col md="12">
                <ClientPresence presences={presences} />
              </Col>
            )}
          </Row>
        </>
      )}
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(ClientProfile)
