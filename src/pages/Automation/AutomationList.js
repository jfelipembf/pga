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

    const handleSaveTemplates = async (templates) => {
        const newData = { ...integrationConfig, messageTemplates: templates };
        await saveIntegrations(newData);
    }

    // Sidebar Content (Lista de Categorias apenas)
    const SidebarContent = (
        <div className="d-flex flex-column h-100">
            <h6 className="text-muted text-uppercase font-size-11 mb-3 mt-2">Navegação</h6>
            <div className="d-grid gap-1 mb-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`btn btn-sm text-start ${selectedCategory === cat ? 'active bg-soft-info text-info fw-bold' : 'btn-ghost-secondary text-muted'}`}
                        onClick={() => setSelectedCategory(cat)}
                        style={{ border: 'none', paddingLeft: '0.5rem' }}
                    >
                        <i className="mdi mdi-folder-text-outline me-2"></i> {cat}
                    </button>
                ))}
            </div>

            <div className="mt-auto border-top pt-3">
                <div className="alert alert-info font-size-12 mb-0 p-2">
                    <i className="mdi mdi-information-outline me-1"></i>
                    Para configurar o envio (WhatsApp/IA), acesse <Link to="/settings/integrations" className="fw-bold text-info text-decoration-underline">Integrações</Link>.
                </div>
            </div>
        </div>
    )

    // Main Content (Template Editor)
    const MainContent = (
        <TemplateEditor
            customTemplates={integrationConfig?.messageTemplates}
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
