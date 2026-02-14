import React, { useState } from "react"
import { Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap"
import classnames from "classnames"

// Import Dashboards
import ManagementDashboard from "./Management"
import OperationalDashboard from "./Operational"
import FinancialDashboard from "./Financial"
import TeacherDashboard from "./Teacher"

const Dashboard = () => {
  document.title = "Dashboard | PGA Admin"

  const [activeTab, setActiveTab] = useState("1")

  const toggle = tab => {
    if (activeTab !== tab) setActiveTab(tab)
  }

  return (
    <React.Fragment>
      <Row>
        <Col lg={12}>
          <Nav className="mb-4">
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "1" })}
                onClick={() => { toggle("1") }}
                style={{
                  cursor: "pointer",
                  border: "none",
                  borderBottom: activeTab === "1" ? "4px solid #466a8f" : "4px solid transparent",
                  backgroundColor: "transparent",
                  color: activeTab === "1" ? "#466a8f" : "#495057",
                  fontWeight: activeTab === "1" ? "600" : "400"
                }}
              >
                <i className="mdi mdi-home-variant d-sm-none"></i>
                <span className="d-none d-sm-block">Gerencial</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "2" })}
                onClick={() => { toggle("2") }}
                style={{
                  cursor: "pointer",
                  border: "none",
                  borderBottom: activeTab === "2" ? "4px solid #466a8f" : "4px solid transparent",
                  backgroundColor: "transparent",
                  color: activeTab === "2" ? "#466a8f" : "#495057",
                  fontWeight: activeTab === "2" ? "600" : "400"
                }}
              >
                <i className="mdi mdi-account-group d-sm-none"></i>
                <span className="d-none d-sm-block">Operacional</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "3" })}
                onClick={() => { toggle("3") }}
                style={{
                  cursor: "pointer",
                  border: "none",
                  borderBottom: activeTab === "3" ? "4px solid #466a8f" : "4px solid transparent",
                  backgroundColor: "transparent",
                  color: activeTab === "3" ? "#466a8f" : "#495057",
                  fontWeight: activeTab === "3" ? "600" : "400"
                }}
              >
                <i className="mdi mdi-cash-multiple d-sm-none"></i>
                <span className="d-none d-sm-block">Financeiro</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "4" })}
                onClick={() => { toggle("4") }}
                style={{
                  cursor: "pointer",
                  border: "none",
                  borderBottom: activeTab === "4" ? "4px solid #466a8f" : "4px solid transparent",
                  backgroundColor: "transparent",
                  color: activeTab === "4" ? "#466a8f" : "#495057",
                  fontWeight: activeTab === "4" ? "600" : "400"
                }}
              >
                <i className="mdi mdi-school d-sm-none"></i>
                <span className="d-none d-sm-block">Professor</span>
              </NavLink>
            </NavItem>
          </Nav>

          <TabContent activeTab={activeTab} className="text-muted">
            <TabPane tabId="1">
              <ManagementDashboard />
            </TabPane>
            <TabPane tabId="2">
              <OperationalDashboard />
            </TabPane>
            <TabPane tabId="3">
              <FinancialDashboard />
            </TabPane>
            <TabPane tabId="4">
              <TeacherDashboard />
            </TabPane>
          </TabContent>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default Dashboard