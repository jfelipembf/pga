import React, { useEffect } from "react"
import { connect } from "react-redux"
import { Row, Col } from "reactstrap"

// Pages Components
import Miniwidget from "../../components/Dashbooard/Miniwidget"
import MonthlyEarnings2 from "../../components/Dashbooard/montly-earnings2"
import ConversionFunnel from "../../components/Dashbooard/conversion-funnel"

import { setBreadcrumbItems } from "../../store/actions"
import PageLoader from "../../components/Common/PageLoader"
import { useDashboardLogic } from "./Hooks/useDashboardLogic"

const Dashboard = (props) => {
  document.title = "Dashboard | Painel Swim"

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Dashboard", link: "#" }
    ]
    props.setBreadcrumbItems('Dashboard', breadcrumbItems)
  }, [props])

  const {
    isLoading,
    reports,
    monthly,
    monthlyHistory,
    monthlyCurrent,
    monthlyPrevious,
    monthlyData
  } = useDashboardLogic()

  return (
    <React.Fragment>
      {isLoading('page') ? (
        <PageLoader />
      ) : (
        <>
          <Miniwidget reports={reports} loading={false} />

          <Row>
            <Col xl="8">
              <ConversionFunnel data={monthly} historicalData={monthlyHistory} />
            </Col>

            <Col xl="4">
              <MonthlyEarnings2 current={monthlyCurrent} previous={monthlyPrevious} data={monthlyData} />
            </Col>
          </Row>
        </>
      )}
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(Dashboard)
