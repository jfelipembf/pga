import React, { useState, useEffect } from "react"
import { Container, Row, Col, Card, CardBody, CardHeader } from "reactstrap"
import { connect } from "react-redux"

// Components
import SideMenu from "components/Common/SideMenu"
import AutomationDetail from "./components/AutomationDetail"

// Hooks & Constants
import { useAutomations } from "./hooks/useAutomations"
import { TRIGGER_LABELS, TRIGGER_CONFIG } from "./constants/triggers"

// Actions
import { setBreadcrumbItems } from "../../../store/actions"

// Custom Components
import PageLoader from "../../../components/Common/PageLoader"

const AutomationsPage = ({ setBreadcrumbItems }) => {
    const { automations, loading, saveAutomation } = useAutomations()
    const [selectedId, setSelectedId] = useState(null)

    // Select the first automation by default when loaded
    useEffect(() => {
        if (automations.length > 0 && !selectedId) {
            setSelectedId(automations[0].id)
        }
    }, [automations, selectedId])

    useEffect(() => {
        // Set breadcrumbs in global header instead of page content
        const breadcrumbs = [
            { title: "Gerencial", link: "/management/automations" },
            { title: "Automações", link: "/management/automations" },
        ]
        setBreadcrumbItems("Automações", breadcrumbs)
    }, [setBreadcrumbItems])

    document.title = "Automações | Painel Swim"

    const selectedAutomation = automations.find(a => a.id === selectedId)

    // Helper formatting for SideMenu
    const menuItems = automations
        .map(auto => {
            const config = TRIGGER_CONFIG[auto.trigger] || {}
            return {
                id: auto.id,
                title: config.label || auto.name,
                subtitle: auto.active ? "Ativo" : "Inativo",
                color: auto.active ? "success" : "secondary",
                category: config.category || "Outros", // For grouping
                original: auto
            }
        })
        .sort((a, b) => {
            // Sort by Category first, then by Title
            if (a.category < b.category) return -1
            if (a.category > b.category) return 1
            return a.title.localeCompare(b.title)
        })

    // Inject headers for grouping
    const formattedItems = []
    let lastCategory = null

    menuItems.forEach(item => {
        if (item.category !== lastCategory) {
            formattedItems.push({
                id: `header-${item.category}`,
                title: item.category,
                isHeader: true
            })
            lastCategory = item.category
        }
        // Add the item itself
        formattedItems.push(item)
    })

    if (loading && automations.length === 0) {
        return <PageLoader />
    }

    return (
        <Container fluid>
            <Row className="g-4">
                <Col lg={4}>
                    <SideMenu
                        title="Gatilhos"
                        description="Selecione um evento para configurar a automação."
                        items={formattedItems}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        emptyLabel="Nenhum gatilho disponível."
                    />
                </Col>

                <Col lg={8}>
                    <Card className="shadow-sm h-100">
                        <CardHeader className="bg-white">
                            <h5 className="mb-0">Configuração</h5>
                        </CardHeader>
                        <CardBody>
                            <AutomationDetail
                                automation={selectedAutomation}
                                onSave={saveAutomation}
                                triggerLabels={TRIGGER_LABELS}
                            />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default connect(null, { setBreadcrumbItems })(AutomationsPage)
