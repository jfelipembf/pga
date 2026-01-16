import React from "react"
import { Card, CardBody, Row, Col } from "reactstrap"
import Spinner from "components/Common/Spinner"

const OperationalMiniWidgets = ({ reports = [], isLoading = false }) => {
    if (isLoading) {
        return (
            <Row>
                {[1, 2, 3, 4].map(i => (
                    <Col xl={3} sm={6} key={i}>
                        <Card className="mini-stat bg-primary">
                            <CardBody className="mini-stat-img text-center p-5">
                                <Spinner />
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>
        )
    }

    return (
        <Row>
            {reports.map((report, key) => (
                <Col xl={3} sm={6} key={key}>
                    <Card className="mini-stat bg-primary">
                        <CardBody className="mini-stat-img">
                            <div className="mini-stat-icon">
                                <i className={"float-end mdi mdi-" + report.iconClass}></i>
                            </div>
                            <div className="text-white">
                                <h6 className="text-uppercase mb-3 font-size-16 text-white">{report.title}</h6>
                                <h2 className="mb-4 text-white">{report.total}</h2>
                                {report.average && (
                                    <span className={"badge bg-" + report.badgecolor}> {report.average} </span>
                                )}
                                <span className="ms-2">{report.label}</span>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            ))}
        </Row>
    )
}

export default OperationalMiniWidgets
