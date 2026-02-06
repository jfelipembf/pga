import React from "react"
import PropTypes from "prop-types"
import { Row, Col, Card, CardBody, Button, Input } from "reactstrap"
import PageLoader from "./PageLoader"

const ManagementLayout = ({
    sidebarTitle,
    sidebarContent,
    onAddClick,
    addLabel = "Novo",
    mainContent,
    isLoading
}) => {
    if (isLoading) return <PageLoader />

    return (
        <React.Fragment>
            <Row>
                {/* Sidebar / Lista Lateral */}
                <Col lg={4} xl={3}>
                    <Card className="h-100 shadow-sm">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="card-title mb-0">{sidebarTitle}</h4>
                                <Button
                                    color="primary"
                                    size="sm"
                                    className="waves-effect waves-light"
                                    onClick={onAddClick}
                                >
                                    <i className="mdi mdi-plus me-1"></i> {addLabel}
                                </Button>
                            </div>

                            <div className="search-box chat-search-box pb-3 border-bottom">
                                <div className="position-relative">
                                    <Input type="text" className="form-control" placeholder="Buscar..." />
                                    <i className="mdi mdi-magnify search-icon"></i>
                                </div>
                            </div>

                            <div className="mt-3" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                                {sidebarContent}
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Conteúdo Principal / Formulário */}
                <Col lg={8} xl={9}>
                    <Card className="h-100 shadow-sm">
                        <CardBody>
                            {mainContent}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

ManagementLayout.propTypes = {
    sidebarTitle: PropTypes.string,
    sidebarContent: PropTypes.node,
    onAddClick: PropTypes.func,
    addLabel: PropTypes.string,
    mainContent: PropTypes.node,
    isLoading: PropTypes.bool
}

export default ManagementLayout
