import React, { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Card, CardBody, CardHeader } from "reactstrap"
import { connect, useSelector } from "react-redux"
import { httpsCallable } from "firebase/functions"
import { getFirebaseFunctions } from "../../../helpers/firebase_helper"

// Custom Components
import PageLoader from "../../../components/Common/PageLoader"
import { useToast } from "../../../components/Common/ToastProvider"

// Components
import SideMenu from "components/Common/SideMenu"
import IntegrationForm from "./components/IntegrationForm"
import TestMessageForm from "./components/TestMessageForm"

// Constants
import { INTEGRATIONS_LIST } from "./constants/integrationsList"

// Actions
import { setBreadcrumbItems } from "../../../store/actions"

const IntegrationsPage = ({ setBreadcrumbItems }) => {
    // Redux & State
    const { idBranch } = useSelector(state => state.Branch)
    const { tenant } = useSelector(state => state.Tenant)
    const idTenant = tenant?.idTenant || tenant?.id || localStorage.getItem("idTenant")

    const [selectedIntegration, setSelectedIntegration] = useState("gemini")
    const [configData, setConfigData] = useState({})
    const [loading, setLoading] = useState(false) // Saving state
    const [isFetching, setIsFetching] = useState(false) // Fetching state
    const [isInitializing, setIsInitializing] = useState(true) // Initial Page Load

    // Hooks
    const toast = useToast()

    // Breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { title: "Gerencial", link: "/management/evaluation-levels" },
            { title: "Integrações", link: "/management/integrations" },
        ]
        setBreadcrumbItems("Integrações", breadcrumbs)
    }, [setBreadcrumbItems])

    // Fetch Config Logic
    const fetchConfig = useCallback(async () => {
        // Validation: If no branch, we can't fetch, but we stop initializing to show the UI (and the warning inside form)
        if (!selectedIntegration || !idBranch) {
            setIsFetching(false)
            setIsInitializing(false)
            return
        }

        setIsFetching(true)
        try {
            const functions = getFirebaseFunctions()
            const getConfig = httpsCallable(functions, 'getIntegrationConfig')
            const result = await getConfig({ integrationId: selectedIntegration, idBranch, idTenant })
            setConfigData(result.data.config || {})
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro", description: "Erro ao carregar configurações.", color: "danger" })
        } finally {
            setIsFetching(false)
            setIsInitializing(false)
        }
    }, [selectedIntegration, idBranch, idTenant, toast])

    // Trigger Fetch on Selection/Branch Change
    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

    // Save Logic
    const handleSave = async () => {
        if (!idBranch) {
            toast.show({ title: "Atenção", description: "Selecione uma filial para continuar.", color: "warning" })
            return
        }

        setLoading(true)
        try {
            const functions = getFirebaseFunctions()
            const saveConfig = httpsCallable(functions, 'saveIntegrationConfig')
            await saveConfig({ integrationId: selectedIntegration, config: configData, idBranch, idTenant })
            toast.show({ title: "Sucesso", description: "Configurações salvas com sucesso!", color: "success" })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro", description: e?.message || "Erro ao salvar configurações.", color: "danger" })
        } finally {
            setLoading(false)
        }
    }

    const selectedItem = INTEGRATIONS_LIST.find(i => i.id === selectedIntegration)

    // Full Page Loading (Initial)
    if (isInitializing) {
        return <PageLoader />
    }

    return (
        <React.Fragment>
            <Container fluid>
                <Row className="g-4">
                    <Col lg={4}>
                        <SideMenu
                            title="Integrações"
                            description="Gerencie suas conexões externas."
                            items={INTEGRATIONS_LIST}
                            selectedId={selectedIntegration}
                            onSelect={setSelectedIntegration}
                            emptyLabel="Nenhuma integração disponível."
                        />
                    </Col>
                    <Col lg={8}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-white">
                                <h5 className="mb-0">{selectedItem?.title || "Configuração"}</h5>
                            </CardHeader>
                            <CardBody>
                                <IntegrationForm
                                    selected={selectedIntegration}
                                    data={configData}
                                    onChange={setConfigData}
                                    onSave={handleSave}
                                    loading={loading}
                                    isFetching={isFetching}
                                    showBranchWarning={!idBranch}
                                />
                                {selectedIntegration === "evolution" && <TestMessageForm />}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(IntegrationsPage)
