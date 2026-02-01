import React from "react"
import { Row, Col, Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"
import { useNavigate, useParams } from "react-router-dom"

// Hooks e Contextos
import { useClientProfile } from "./hooks/useClientProfile"
import { TAB_LIST, PROFILE_TABS } from "./constants/profileConstants"

// Componentes Comuns
import PageLoader from "../../../components/Common/PageLoader"
import StatusBadge from "../../../components/Common/StatusBadge"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"

// Sub-componentes do Perfil
import ClientSummary from "./components/ClientSummary"
import ClientProfileForm from "./components/ClientProfileForm"
import ClientFinancial from "./components/ClientFinancial"

// Estilos
import "./ClientProfile.scss"

const ClientProfile = () => {
    const navigate = useNavigate()
    const { idTenant, idBranch } = useParams() // Get IDs from URL (matching App.js definition)
    const {
        client,
        loading,
        activeTab,
        setActiveTab,
        handleDelete,
        isDeleting
    } = useClientProfile()

    const [menuOpen, setMenuOpen] = React.useState(false)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)

    if (loading) {
        return <PageLoader />
    }

    const profileDisplay = {
        name: client ? `${client.firstName} ${client.lastName}` : "Carregando...",
        photo: (client?.photo || client?.photoUrl) || `https://ui-avatars.com/api/?name=${client?.firstName}+${client?.lastName}&background=random`,
        cover: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=2074&auto=format&fit=crop", // Swimming Pool Clear
        id: client?.friendlyId || client?.id?.substring(0, 6).toUpperCase()
    }

    return (
        <React.Fragment>
            <div className="client-profile">
                <div
                    className="client-profile__hero"
                    style={{
                        backgroundImage: `url("${profileDisplay.cover}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <div className="client-profile__content">
                        <div className="d-flex align-items-center gap-4">
                            <div className="client-profile__avatar-wrapper">
                                <div
                                    className="client-profile__avatar"
                                    style={{ backgroundImage: `url("${profileDisplay.photo}")` }}
                                />
                                <label htmlFor="clientAvatar" className="client-profile__camera">
                                    <i className="mdi mdi-camera" />
                                </label>
                            </div>
                            <div className="text-white">
                                <h3 className="mb-1 text-white">{profileDisplay.name}</h3>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="fw-semibold">ID: {profileDisplay.id}</span>
                                    <StatusBadge status={client?.lifecycleStatus} />
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                            <Button
                                color="success"
                                className="d-flex align-items-center gap-2"
                                onClick={() => {
                                    navigate(`/${idTenant}/${idBranch}/sales/new`, {
                                        state: {
                                            idClient: client?.id,
                                            clientName: `${client?.firstName} ${client?.lastName}`,
                                            friendlyId: client?.friendlyId
                                        }
                                    });
                                }}
                            >
                                <i className="mdi mdi-cart-outline" />
                                Nova Venda
                            </Button>

                            <Button color="light" className="d-flex align-items-center gap-2">
                                <i className="mdi mdi-content-save" />
                                Salvar Alterações
                            </Button>

                            <div className="ms-2 border-start ps-3">
                                <Dropdown isOpen={menuOpen} toggle={() => setMenuOpen(!menuOpen)}>
                                    <DropdownToggle color="transparent" className="p-0 border-0 text-white">
                                        <i className="mdi mdi-dots-vertical fs-4" />
                                    </DropdownToggle>
                                    <DropdownMenu end>
                                        <DropdownItem onClick={() => setConfirmDeleteOpen(true)} className="text-danger">
                                            <i className="mdi mdi-trash-can-outline me-2" />
                                            Excluir {client?.lifecycleStatus === 'lead' ? 'Lead' : 'Cliente'}
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>

                    <div className="client-profile__tabs">
                        {TAB_LIST.map(tab => (
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

                <Row className="mt-3">
                    <Col lg={12}>
                        {activeTab === PROFILE_TABS.SUMMARY && (
                            <ClientSummary client={client} />
                        )}
                        {activeTab === PROFILE_TABS.PROFILE && (
                            <ClientProfileForm client={client} />
                        )}
                        {activeTab === PROFILE_TABS.FINANCIAL && (
                            <ClientFinancial client={client} />
                        )}
                        {/* Abas removidas conforme solicitado */}
                    </Col>
                </Row>
            </div>

            <ConfirmDialog
                isOpen={confirmDeleteOpen}
                toggle={() => setConfirmDeleteOpen(!confirmDeleteOpen)}
                title={`Excluir ${client?.lifecycleStatus === 'lead' ? 'Lead' : 'Cliente'}`}
                description={`Tem certeza que deseja excluir ${profileDisplay.name}? Esta ação não pode ser desfeita.`}
                confirmText="Sim, excluir"
                confirmColor="danger"
                onConfirm={handleDelete}
                loading={isDeleting}
            />
        </React.Fragment>
    )
}

export default ClientProfile
