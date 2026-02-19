import React, { useState, useEffect, useMemo } from "react"
import { Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap"
import classnames from "classnames"
import { useAuth } from "../../hooks/useAuth"

// Import Dashboards
import ManagementDashboard from "./Management"
import OperationalDashboard from "./Operational"
import FinancialDashboard from "./Financial"
import TeacherDashboard from "./Teacher"

const Dashboard = () => {
  document.title = "Dashboard | PGA Admin"

  const { hasAnyPermission, isOwner } = useAuth()

  // Definição das Tabs com suas permissões
  const tabsConfig = useMemo(() => [
    {
      id: "1",
      label: "Gerencial",
      icon: "mdi mdi-home-variant",
      component: ManagementDashboard,
      permissions: ["dashboards_management_view"]
    },
    {
      id: "2",
      label: "Operacional",
      icon: "mdi mdi-account-group",
      component: OperationalDashboard,
      permissions: ["dashboards_operational_view"]
    },
    {
      id: "3",
      label: "Financeiro",
      icon: "mdi mdi-cash-multiple",
      component: FinancialDashboard,
      permissions: ["dashboards_financial_view"]
    },
    {
      id: "4",
      label: "Professor",
      icon: "mdi mdi-school",
      component: TeacherDashboard,
      permissions: ["dashboards_teacher_view"]
    }
  ], [])

  // Filtrar tabs permitidas
  const allowedTabs = useMemo(() => {
    if (isOwner) return tabsConfig;

    return tabsConfig.filter(tab => {
      if (!tab.permissions) return true; // Se não tiver permissão definida, exibe (ou define comportamento padrão)
      return hasAnyPermission(tab.permissions);
    });
  }, [tabsConfig, isOwner, hasAnyPermission]);

  const [activeTab, setActiveTab] = useState(allowedTabs[0]?.id || "1")

  // Garantir que a tab ativa é válida quando as permissões mudam (ou no load inicial)
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.find(t => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id);
    }
  }, [allowedTabs, activeTab]);

  const toggle = tab => {
    if (activeTab !== tab) setActiveTab(tab)
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="text-center mt-5">
        <h4>Acesso não autorizado a nenhum dashboard.</h4>
      </div>
    )
  }

  return (
    <React.Fragment>
      <Row>
        <Col lg={12}>
          <Nav className="mb-4">
            {allowedTabs.map(tab => (
              <NavItem key={tab.id}>
                <NavLink
                  className={classnames({ active: activeTab === tab.id })}
                  onClick={() => { toggle(tab.id) }}
                  style={{
                    cursor: "pointer",
                    border: "none",
                    borderBottom: activeTab === tab.id ? "4px solid #466a8f" : "4px solid transparent",
                    backgroundColor: "transparent",
                    color: activeTab === tab.id ? "#466a8f" : "#495057",
                    fontWeight: activeTab === tab.id ? "600" : "400"
                  }}
                >
                  <i className={`${tab.icon} d-sm-none`}></i>
                  <span className="d-none d-sm-block">{tab.label}</span>
                </NavLink>
              </NavItem>
            ))}
          </Nav>

          <TabContent activeTab={activeTab} className="text-muted">
            {allowedTabs.map(tab => (
              <TabPane key={tab.id} tabId={tab.id}>
                <tab.component />
              </TabPane>
            ))}
          </TabContent>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default Dashboard