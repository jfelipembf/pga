import React, { useEffect, useMemo } from "react"
import { connect } from "react-redux"
import { Row, Col } from "reactstrap"

// Components
import OperationalMiniWidgets from "./Components/OperationalMiniWidgets"
import ExperimentalTracker from "./Components/ExperimentalTracker"
import OperationalAlerts from "./Components/OperationalAlerts"

import { setBreadcrumbItems } from "../../store/actions"
import { useOperationalDashboardLogic } from "./Hooks/useOperationalDashboardLogic"

import PageLoader from "../../components/Common/PageLoader"

const OperationalDashboard = ({ setBreadcrumbItems }) => {
    document.title = "Dashboard Operacional | Painel Swim"
    const { reports, experimentals, tasks, birthdays, expirations, refreshTasks, markTaskAsCompleted, isLoading } = useOperationalDashboardLogic()

    const breadcrumbItems = useMemo(() => [
        { title: "Dashboard", link: "#" },
        { title: "Operacional", link: "#" }
    ], [])

    useEffect(() => {
        setBreadcrumbItems('Dashboard Operacional', breadcrumbItems)
    }, [setBreadcrumbItems, breadcrumbItems])

    if (isLoading) {
        return <PageLoader />
    }

    return (
        <React.Fragment>
            <OperationalMiniWidgets reports={reports} isLoading={isLoading} />

            <Row className="mb-5 pb-5">
                <Col xl="3" md="6">
                    <ExperimentalTracker experimentals={experimentals} isLoading={isLoading} />
                </Col>
                <Col xl="9" md="6">
                    <OperationalAlerts
                        tasks={tasks}
                        birthdays={birthdays}
                        expirations={expirations}
                        refreshTasks={refreshTasks}
                        markTaskAsCompleted={markTaskAsCompleted}
                    />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(OperationalDashboard)
