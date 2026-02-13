
import React, { useEffect } from "react";
import { Row, Col, Card, CardBody } from "reactstrap";
import { connect } from "react-redux";
import { setBreadcrumbItems } from "../../../store/actions";
import PageLoader from "../../../components/Common/PageLoader";
import OverlayLoader from "../../../components/Common/OverlayLoader";
import IntegrationForm from "./components/IntegrationForm";
import { useAutomation } from "../../Management/Automation/hooks/useAutomation";

const IntegrationPage = React.memo(({ setBreadcrumbItems }) => {
    document.title = "Integrações | PGA Admin";

    // Reutilizando o hook existente para carregar/salvar configs no banco
    const { integrationConfig, saving, saveIntegrations, loading } = useAutomation();

    useEffect(() => {
        setBreadcrumbItems("Configurações", [
            { title: "Sistema", link: "#" },
            { title: "Integrações", link: "/integration" }
        ]);
    }, [setBreadcrumbItems]);

    return (
        <React.Fragment>
            <Row>
                <Col lg="12">
                    <Card className="position-relative" style={{ minHeight: '400px' }}>
                        <OverlayLoader show={saving} label="Salvando configurações..." />

                        <CardBody>
                            {loading && !integrationConfig ? (
                                <PageLoader isFullScreen={false} />
                            ) : (
                                <IntegrationForm
                                    initialValues={integrationConfig}
                                    onSave={saveIntegrations}
                                    loading={saving}
                                />
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
});

export default connect(null, { setBreadcrumbItems })(IntegrationPage);
