import React, { useEffect } from "react";
import { Container } from "reactstrap";
import { connect } from "react-redux";
import { setBreadcrumbItems } from "../../store/actions";
import { IntegrationSettings } from "../Automation/components/IntegrationSettings";
import { useAutomation } from "../Automation/hooks/useAutomation";

const IntegrationPage = ({ setBreadcrumbItems }) => {
    document.title = "Integrações | PGA Admin";

    // Reutilizando o hook existente para carregar/salvar configs
    const { integrationConfig, saving, saveIntegrations } = useAutomation();

    useEffect(() => {
        setBreadcrumbItems("Configurações", [
            { title: "Sistema", link: "#" },
            { title: "Integrações", link: "/integration" }
        ]);
    }, [setBreadcrumbItems]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <IntegrationSettings
                        initialValues={integrationConfig}
                        onSave={saveIntegrations}
                        loading={saving}
                    />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default connect(null, { setBreadcrumbItems })(IntegrationPage);
