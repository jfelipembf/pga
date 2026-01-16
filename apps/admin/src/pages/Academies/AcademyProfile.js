import React from "react"
import { Container, Row, Col } from "reactstrap"
import { useParams } from "react-router-dom"
import PageLoader from "../../components/Common/PageLoader"
import AcademyProfileForm from "./components/AcademyProfileForm"
import AcademyBilling from "./components/AcademyBilling"
import AcademyProfileHeader from "./components/AcademyProfileHeader"
import { useAcademyProfile } from "./hooks/useAcademyProfile"
import { TABS } from "./constants/academyConstants"

const AcademyProfile = () => {
    const { id } = useParams()
    const {
        academy,
        staff,
        loading,
        activeTab,
        setActiveTab,
        isCreatingNew,
        isEditing,
        setIsEditing,
        formData,
        setLocalData,
        submitting,
        profile,
        tenantBranches,
        initialFormData,
        handleSelectBranch,
        handleNewBranch,
        handleCancel,
        handlePhotoChange,
        handleSave,
        handleUpdate
    } = useAcademyProfile(id)

    if (loading) return <PageLoader />

    if (!profile && !isCreatingNew) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="alert alert-warning">Academia não encontrada.</div>
                </Container>
            </div>
        )
    }

    return (
        <React.Fragment>
            <Container fluid className="academy-profile">
                <AcademyProfileHeader
                    profile={profile}
                    tenantBranches={tenantBranches}
                    onSelectBranch={handleSelectBranch}
                    onNewBranch={handleNewBranch}
                    currentBranchId={id}
                    isCreatingNew={isCreatingNew}
                    onPhotoChange={handlePhotoChange}
                    submitting={submitting}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    tabs={TABS}
                />

                <Row className="g-4 mt-3">
                    {activeTab === "Perfil" && (
                        <Col md="12">
                            <AcademyProfileForm
                                value={formData}
                                onChange={setLocalData}
                                onSave={isEditing ? handleUpdate : handleSave}
                                onCancel={handleCancel}
                                onEdit={() => {
                                    setLocalData(initialFormData)
                                    setIsEditing(true)
                                }}
                                isCreatingNew={isCreatingNew}
                                isEditing={isEditing}
                                submitting={submitting}
                                users={staff}
                            />
                        </Col>
                    )}
                    {activeTab === "Faturamento" && (
                        <Col md="12">
                            <AcademyBilling academy={academy} />
                        </Col>
                    )}
                </Row>
            </Container>
        </React.Fragment>
    )
}

export default AcademyProfile
