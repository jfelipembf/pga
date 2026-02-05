import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Card, CardBody, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"
import { useAutomation } from "./hooks/useAutomation"
import { AutomationForm } from "./components/AutomationForm"
import { IntegrationSettings } from "./components/IntegrationSettings"
import ManagementLayout from "../../components/Common/ManagementLayout"
import { setBreadcrumbItems } from "../../store/actions"

const AutomationPage = ({ setBreadcrumbItems }) => {
    document.title = "Automação Inteligente | Lexa Admin"

    const {
        workflows,
        integrationConfig,
        loading,
        saving,
        saveWorkflow,
        deleteWorkflow,
        saveIntegrations
    } = useAutomation()

    const [viewMode, setViewMode] = useState('empty') // 'empty', 'edit', 'create', 'settings'
    const [selectedId, setSelectedId] = useState(null)
    const [formData, setFormData] = useState(null)

    // Configurar Breadcrumb
    useEffect(() => {
        setBreadcrumbItems("Central de Inteligência", [
            { title: "Gestão", link: "#" },
            { title: "Automação", link: "/automation" }
        ])
    }, [setBreadcrumbItems])

    // Handlers
    const handleAddClick = () => {
        setFormData({})
        setSelectedId(null)
        setViewMode('create')
    }

    const handleItemClick = (item) => {
        setSelectedId(item.id)
        setFormData(item)
        setViewMode('edit')
    }

    const handleSettingsClick = () => {
        setSelectedId('settings')
        setFormData(integrationConfig)
        setViewMode('settings')
    }

    const handleSaveForm = async (data) => {
        const success = await saveWorkflow(data)
        if (success) {
            setViewMode('empty')
            setSelectedId(null)
        }
    }

    const handleSaveSettings = async (data) => {
        const success = await saveIntegrations(data)
        if (success) {
            // Mantém na tela de settings
        }
    }

    // --- Sidebar Content (Lista) ---
    const SidebarContent = (
        <div className="d-flex flex-column h-100">
            <div className="mb-3">
                <button
                    className={`btn btn-outline-secondary w-100 text-start ${viewMode === 'settings' ? 'active bg-soft-secondary' : ''}`}
                    onClick={handleSettingsClick}
                >
                    <i className="mdi mdi-cog-outline me-2"></i> Configurar Credenciais
                </button>
            </div>

            <h6 className="text-muted text-uppercase font-size-11 mb-2">Meus Fluxos</h6>

            <div className="flex-grow-1 overflow-auto">
                {loading && workflows.length === 0 && <p className="text-muted small p-2">Carregando...</p>}

                {workflows.map(flow => (
                    <Card
                        key={flow.id}
                        className={`mb-2 shadow-sm border cursor-pointer ${selectedId === flow.id ? 'border-primary bg-soft-light' : ''}`}
                        onClick={() => handleItemClick(flow)}
                        style={{ cursor: 'pointer' }}
                    >
                        <CardBody className="p-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="overflow-hidden">
                                    <h5 className="font-size-13 text-truncate mb-1 text-dark">{flow.name}</h5>
                                    <p className="text-muted font-size-12 mb-0 mb-1">
                                        <i className={`mdi mdi-${flow.aiConfig?.enabled ? 'robot' : 'flash'} me-1 ${flow.aiConfig?.enabled ? 'text-info' : 'text-warning'}`}></i>
                                        {flow.trigger}
                                    </p>
                                </div>
                                <div className={`badge badge-soft-${flow.isActive ? 'success' : 'secondary'} font-size-10 p-1 rounded-circle p-1`} style={{ width: 8, height: 8, minWidth: 8 }}> </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    )

    // --- Main Content (Formulário) ---
    const MainContent = (() => {
        if (viewMode === 'settings') {
            return (
                <IntegrationSettings
                    initialValues={integrationConfig}
                    onSave={handleSaveSettings}
                    loading={saving}
                />
            )
        }

        if (viewMode === 'create' || (viewMode === 'edit' && formData)) {
            return (
                <AutomationForm
                    value={formData}
                    saving={saving}
                    onSave={handleSaveForm}
                    onCancel={() => setViewMode('empty')}
                    onChange={setFormData}
                />
            )
        }

        return (
            <div className="text-center py-5 text-muted mt-5">
                <div className="mb-4">
                    <div className="avatar-lg mx-auto bg-soft-primary rounded-circle d-flex align-items-center justify-content-center">
                        <i className="mdi mdi-robot-excited-outline font-size-40 text-primary"></i>
                    </div>
                </div>
                <h4>Central de Inteligência</h4>
                <p style={{ maxWidth: 400 }} className="mx-auto mt-3">
                    Gerencie automações de mensagens e use Inteligência Artificial para encantar seus clientes.
                    Selecione um item ao lado ou crie uma nova automação.
                </p>
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <i className="mdi mdi-plus me-1"></i> Criar Primeira Automação
                    </button>
                    <button className="btn btn-link text-muted ms-3" onClick={handleSettingsClick}>Configurar Credenciais</button>
                </div>
            </div>
        )
    })()

    return (
        <React.Fragment>
            <ManagementLayout
                sidebarTitle="Automação"
                sidebarContent={SidebarContent}
                mainContent={MainContent}
                onAddClick={handleAddClick}
                addLabel="Nova Automação"
                isLoading={loading}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(AutomationPage)
