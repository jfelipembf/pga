import React, { useEffect, useMemo } from "react"
import { connect } from "react-redux"
import { Row, Col } from "reactstrap"

// Components
import OperationalMiniWidgets from "./Components/OperationalMiniWidgets"
import ExperimentalTracker from "./Components/ExperimentalTracker"
import OperationalAlertCard from "./Components/OperationalAlertCard"
import TaskModal from "./Components/TaskModal"
import TaskDetailModal from "./Components/TaskDetailModal"

import { setBreadcrumbItems } from "../../store/actions"
import { useOperationalDashboardLogic } from "./Hooks/useOperationalDashboardLogic"

import PageLoader from "../../components/Common/PageLoader"

const OperationalDashboard = ({ setBreadcrumbItems }) => {
    document.title = "Dashboard Operacional | PGA"
    const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false)
    const [selectedTask, setSelectedTask] = React.useState(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)

    const handleTaskClick = (task) => {
        setSelectedTask(task)
        setIsDetailModalOpen(true)
    }

    const {
        reports,
        experimentals,
        tasks,
        birthdays,
        expirations,
        refreshTasks,
        markBirthdayAsCompleted,
        markExpirationAsCompleted,
        isLoading
    } = useOperationalDashboardLogic()

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

            <Row className="mb-5 pb-5 g-3">
                <Col xl="3" lg="6">
                    <ExperimentalTracker experimentals={experimentals} isLoading={isLoading} />
                </Col>

                <Col xl="3" lg="6">
                    <OperationalAlertCard
                        title="Minhas Tarefas"
                        type="tasks"
                        items={tasks}
                        onCheck={handleTaskClick}
                        onAdd={() => setIsTaskModalOpen(true)}
                        isLoading={isLoading}
                    />
                </Col>

                <Col xl="3" lg="6">
                    <OperationalAlertCard
                        title="Vencimentos"
                        type="expiration"
                        items={expirations}
                        onCheck={markExpirationAsCompleted}
                        isLoading={isLoading}
                    />
                </Col>

                <Col xl="3" lg="6">
                    <OperationalAlertCard
                        title="Aniversários"
                        type="birthday"
                        items={birthdays}
                        onCheck={markBirthdayAsCompleted}
                        isLoading={isLoading}
                    />
                </Col>
            </Row>

            <TaskModal
                isOpen={isTaskModalOpen}
                toggle={() => setIsTaskModalOpen(!isTaskModalOpen)}
                onTaskCreated={refreshTasks}
            />

            <TaskDetailModal
                isOpen={isDetailModalOpen}
                toggle={() => setIsDetailModalOpen(!isDetailModalOpen)}
                task={selectedTask}
                onTaskUpdated={refreshTasks}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(OperationalDashboard)
