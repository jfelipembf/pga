import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { useAutomation } from "./hooks/useAutomation"
import { TemplateEditor } from "./components/TemplateEditor"
import ManagementLayout from "../../components/Common/ManagementLayout"
import { setBreadcrumbItems } from "../../store/actions"
import { TRIGGER_CONFIG } from "./config/triggers"
import { Link } from "react-router-dom"

const AutomationPage = ({ setBreadcrumbItems }) => {
    document.title = "Mensagens Automáticas | Lexa Admin"

    const {
        integrationConfig,
        loading,
        saving,
        saveIntegrations
    } = useAutomation()

    const [selectedCategory, setSelectedCategory] = useState(null)
    const categories = Array.from(new Set(Object.values(TRIGGER_CONFIG).map(c => c.category))).sort();

    useEffect(() => {
        setBreadcrumbItems("Central de Inteligência", [
            { title: "Gestão", link: "#" },
            { title: "Mensagens", link: "/automation" }
        ])

        // Selecionar primeira categoria por padrão (Leads ou Aulas Experimentais)
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0]);
        }
    }, [setBreadcrumbItems]) // Removed categories/selectedCategory dependencies to avoid loop

    const handleSaveTemplates = async ({ templates, activeStatus }) => {
        const newData = {
            ...integrationConfig,
            messageTemplates: templates,
            activeTriggers: activeStatus
        };
        await saveIntegrations(newData);
    }

    // Sidebar Content (Lista de Categorias apenas)
    const SidebarContent = (
        <div className="d-flex flex-column h-100">
            {categories.map(cat => (
                <div
                    key={cat}
                    className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${selectedCategory === cat ? 'bg-light' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                >
                    <div className="flex-grow-1 overflow-hidden">
                        <h5 className="font-size-14 text-truncate mb-0">{cat}</h5>
                    </div>
                    <div className="flex-shrink-0 ms-2">
                        <i className={`mdi mdi-chevron-right font-size-18 ${selectedCategory === cat ? 'text-primary' : 'text-muted opacity-50'}`}></i>
                    </div>
                </div>
            ))}

            <div className="mt-auto border-top p-3">
                <div className="alert alert-info font-size-12 mb-0 p-2">
                    <i className="mdi mdi-information-outline me-1"></i>
                    Para configurar o envio, acesse <Link to="/settings/integrations" className="fw-bold text-info text-decoration-underline">Integrações</Link>.
                </div>
            </div>
        </div>
    )

    // Main Content (Template Editor)
    const MainContent = (
        <TemplateEditor
            customTemplates={integrationConfig?.messageTemplates}
            activeStatus={integrationConfig?.activeTriggers}
            onSave={handleSaveTemplates}
            loading={saving}
            filterCategory={selectedCategory}
        />
    )

    return (
        <React.Fragment>
            <ManagementLayout
                sidebarTitle="Modelos"
                sidebarContent={SidebarContent}
                mainContent={MainContent}
                onAddClick={null}
                isLoading={loading}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(AutomationPage)
