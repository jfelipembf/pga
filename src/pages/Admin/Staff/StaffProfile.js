import React from "react"
import { Row, Col, Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from "reactstrap"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { useStaffProfile } from "./hooks/useStaffProfile"
// PageLoader removed
import StaffProfileForm from "./Components/StaffProfileForm"
import StaffSchedule from "./Components/StaffSchedule"
import StaffMetrics from "./Components/StaffMetrics"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import "./StaffProfile.scss"

const StaffProfile = ({ setBreadcrumbItems }) => {
    const {
        staff,
        activeTab,
        setActiveTab,
        roles,
        formik,
        photoPreview,
        handlePhotoChange,
        handleDelete,
        handlePasswordChange,
        isChangingPassword,
        handleCepBlur,
        isLoadingCep,
        schedule,
        scheduleLoading,
        activities,
        areas: scheduleAreas,
        metrics,
        metricsLoading,
        loadMetrics,
        showDeleteDialog,
        setShowDeleteDialog,
        handleConfirmDelete,
        isDeleting,
        tenantSlug,
        branchSlug
    } = useStaffProfile()

    const [menuOpen, setMenuOpen] = React.useState(false)

    React.useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "#" },
            { title: "Colaboradores", link: `/${tenantSlug}/${branchSlug}/admin/staff` },
            { title: staff?.name || "Perfil", link: "#" },
        ]
        setBreadcrumbItems("Perfil do Colaborador", breadcrumbItems)
    }, [setBreadcrumbItems, staff, tenantSlug, branchSlug])

    // Incremental loading

    const roleName = roles.find(r => r.id === staff?.roleId)?.name || staff?.roleName || "Colaborador"

    return (
        <React.Fragment>
            <div className="staff-profile">
                {/* Hero section */}
                <div className="staff-profile__hero" style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <div className="staff-profile__content">
                        <div className="d-flex align-items-center gap-4">
                            <div className="staff-profile__avatar-wrapper">
                                <div
                                    className="staff-profile__avatar"
                                    style={{
                                        backgroundImage: photoPreview ? `url("${photoPreview}")` : 'none',
                                        backgroundColor: photoPreview ? 'transparent' : '#e9ecef',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        color: '#adb5bd'
                                    }}
                                >
                                    {!photoPreview && <i className="mdi mdi-account" />}
                                </div>
                                <label htmlFor="staff-photo-input" className="staff-profile__camera">
                                    <i className="mdi mdi-camera" />
                                </label>
                                <input
                                    type="file"
                                    id="staff-photo-input"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <div className="text-white">
                                <h3 className="mb-1 text-white">{staff?.name}</h3>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="badge bg-soft-light text-white">{roleName}</span>
                                    <span className={`badge bg-${staff?.status === 'active' ? 'success' : 'warning'}`}>
                                        {staff?.status === 'active' ? 'Ativo' : staff?.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                color="info"
                                className="d-flex align-items-center gap-2"
                                onClick={() => formik.handleSubmit()}
                                disabled={formik.isSubmitting}
                            >
                                {formik.isSubmitting ? <Spinner size="sm" /> : <i className="mdi mdi-content-save" />}
                                Salvar Alterações
                            </Button>

                            <Dropdown isOpen={menuOpen} toggle={() => setMenuOpen(!menuOpen)}>
                                <DropdownToggle color="transparent" className="p-0 border-0 text-white">
                                    <i className="mdi mdi-dots-vertical fs-4" />
                                </DropdownToggle>
                                <DropdownMenu end>
                                    <DropdownItem onClick={handleDelete} className="text-danger">
                                        <i className="mdi mdi-trash-can-outline me-2" />
                                        Excluir Colaborador
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="staff-profile__tabs">
                        {["Perfil", "Agenda", "Métricas"].map(tab => (
                            <button
                                key={tab}
                                type="button"
                                className={`staff-profile__tab ${activeTab === tab ? "staff-profile__tab--active" : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <Row className="mt-4">
                    <Col lg={12}>
                        {activeTab === "Perfil" && (
                            <StaffProfileForm
                                formik={formik}
                                roles={roles}
                                handlePasswordChange={handlePasswordChange}
                                isChangingPassword={isChangingPassword}
                                handleCepBlur={handleCepBlur}
                                isLoadingCep={isLoadingCep}
                            />
                        )}
                        {activeTab === "Agenda" && (
                            <StaffSchedule
                                schedule={schedule}
                                loading={scheduleLoading}
                                activities={activities}
                                areas={scheduleAreas}
                            />
                        )}
                        {activeTab === "Métricas" && (
                            <StaffMetrics
                                metrics={metrics}
                                loading={metricsLoading}
                                refresh={loadMetrics}
                            />
                        )}
                    </Col>
                </Row>
            </div>

            <ConfirmDialog
                isOpen={showDeleteDialog}
                toggle={() => setShowDeleteDialog(!showDeleteDialog)}
                title="Excluir Colaborador"
                description={`Tem certeza que deseja excluir o colaborador ${staff?.name}? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                confirmColor="danger"
                onConfirm={handleConfirmDelete}
                loading={isDeleting}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(StaffProfile)
