import React from "react"
import { Row, Col, Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from "reactstrap"
import { useNavigate } from "react-router-dom"
import { useTenant } from "../../../hooks/useTenant"

// Hooks e Contextos
import { useClientProfile } from "./hooks/useClientProfile"
import { useClientFinancial } from "./hooks/useClientFinancial"
import { TAB_LIST, PROFILE_TABS } from "./constants/profileConstants"
import { ClientService } from "../../../features/clients"

// Componentes Comuns
import PageLoader from "../../../components/Common/PageLoader"
import StatusBadge from "../../../components/Common/StatusBadge"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import { formatCurrency } from "../../../utils/format"

// Sub-componentes do Perfil
import ClientSummary from "./components/ClientSummary"
import ClientProfileForm from "./components/ClientProfileForm"
import ClientFinancial from "./components/ClientFinancial"
import ClientContracts from "./components/ClientContracts"


// Estilos
import "./ClientProfile.scss"

const ClientProfile = () => {
    const navigate = useNavigate()
    // FIX: Usar useTenant para garantir os IDs corretos (ignorando slug da URL se necessário)
    const { idTenant, idBranch, tenantSlug, branchSlug } = useTenant()



    const navigateToSale = () => {
        // Usa Slugs se disponíveis, senão IDs
        const tLink = tenantSlug || idTenant;
        const bLink = branchSlug || idBranch;
        navigate(`/${tLink}/${bLink}/sales/new`, {
            state: {
                idClient: client?.id,
                clientName: `${client?.firstName} ${client?.lastName}`,
                friendlyId: client?.friendlyId
            }
        });
    }
    // ID do cliente continua vindo da URL (se rota for /clients/:id)
    // Se id estiver undefined aqui, pode ser que useClientProfile o capture. Mas vamos garantir.
    // O hook useClientProfile já faz const { id } = useParams(). 
    // Aqui no componente precisamos de id? Não explicitamente, mas useClientProfile resolve.

    // MAS espere, se useParams tem { idTenant, idBranch, id }, e eu chamo useTenant...
    // useClientProfile chama useParams() e pega 'id'. Ok.

    const {
        client,
        loading,
        activeTab,
        setActiveTab,
        handleDelete,
        isDeleting,
        formik
    } = useClientProfile()

    // Resumo financeiro e contratos para a Header
    const { summary, contracts } = useClientFinancial()

    // Fonte Única de Verdade para o Status do Aluno
    const liveStatus = ClientService.calculateLiveStatus(client, contracts);

    // Recalcula estados baseados no summary atualizado
    const hasDebt = summary && summary.totalPending > 0.01
    const isOverdue = summary && summary.totalOverdue > 0.01

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
                                    <StatusBadge status={liveStatus} />
                                </div>

                                {hasDebt && (
                                    <div className="mt-3">
                                        <div
                                            className={`d-inline-flex align-items-center gap-2 px-3 py-2 rounded shadow-lg ${isOverdue ? 'bg-danger' : 'bg-warning'}`}
                                            style={{
                                                color: '#fff',
                                                fontSize: '14px',
                                                fontWeight: '800',
                                                border: '2px solid rgba(255, 255, 255, 0.2)'
                                            }}
                                        >
                                            <i className={isOverdue ? "mdi mdi-alert-octagon font-size-20" : "mdi mdi-alert-circle-outline font-size-20"} />
                                            <span className="text-uppercase letter-spacing-1">
                                                {isOverdue ? 'Débito Vencido' : 'Saldo Devedor'}: {formatCurrency(isOverdue ? summary.totalOverdue : summary.totalPending)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-2 flex-wrap align-items-center">
                            <Button
                                color="success"
                                className="d-flex align-items-center gap-2"
                                onClick={navigateToSale}
                            >
                                <i className="mdi mdi-cart-outline" />
                                Nova Venda
                            </Button>

                            {activeTab === PROFILE_TABS.PROFILE && (
                                <Button
                                    color="info"
                                    className="d-flex align-items-center gap-2 shadow-sm"
                                    onClick={() => formik.handleSubmit()}
                                    disabled={formik.isSubmitting}
                                >
                                    {formik.isSubmitting ? <Spinner size="sm" /> : <i className="mdi mdi-content-save" />}
                                    {formik.isSubmitting ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            )}

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
                            <ClientProfileForm formik={formik} />
                        )}
                        {activeTab === PROFILE_TABS.FINANCIAL && (
                            <ClientFinancial client={client} />
                        )}
                        {activeTab === PROFILE_TABS.CONTRACTS && (
                            <ClientContracts client={client} />
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
