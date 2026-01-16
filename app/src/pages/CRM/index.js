import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Col, Container, Row } from "reactstrap"

import SideMenu from "components/Common/SideMenu"
import CrmList from "./Components/CrmList"
import CrmDetail from "./Components/CrmDetail"
import { setBreadcrumbItems } from "../../store/actions"


import { CRM_SEGMENTS } from "./Constants/crmSegments"
import { useCrmData } from "./Hooks/useCrmData"
import PageLoader from "../../components/Common/PageLoader"

const CRMPage = ({ setBreadcrumbItems }) => {
  const [activeSegment, setActiveSegment] = useState(CRM_SEGMENTS[0].id)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [dateRange, setDateRange] = useState([null, null])

  // Use real data hook
  const { clients: filteredClients, loading } = useCrmData(activeSegment, dateRange)

  useEffect(() => {
    const breadcrumbs = [{ title: "CRM", link: "/crm" }]
    setBreadcrumbItems("CRM", breadcrumbs)
  }, [setBreadcrumbItems])

  // Reset filter when changing segment
  useEffect(() => {
    setDateRange([null, null])
  }, [activeSegment])

  // Removed mock init useEffect

  useEffect(() => {
    if (filteredClients.length) {
      setSelectedClientId(filteredClients[0].id)
    } else {
      setSelectedClientId(null)
    }
  }, [filteredClients])

  const selectedClient = filteredClients.find(c => c.id === selectedClientId) || null

  if (loading) {
    return <PageLoader />
  }

  return (
    <Container fluid className="crm-page">
      <Row className="g-4">
        <Col xl="3" lg="4">
          <SideMenu
            title="CRM"
            description="Segmentos principais"
            items={CRM_SEGMENTS.map(segment => ({
              id: segment.id,
              title: segment.title,
              subtitle: segment.description,
            }))}
            selectedId={activeSegment}
            onSelect={setActiveSegment}
            emptyLabel="Nenhum segmento."
          />
        </Col>

        <Col xl="9" lg="8">
          <Row className="g-4">
            <Col md="6">
              <CrmList
                title={CRM_SEGMENTS.find(s => s.id === activeSegment)?.title || "Clientes"}
                description="Selecione um cliente para ver os detalhes."
                clients={filteredClients}
                selectedId={selectedClientId}
                onSelect={setSelectedClientId}
                dateRange={dateRange}
                onChangeRange={range => setDateRange(range)}
                loading={loading}
              />
            </Col>
            <Col md="6">
              <CrmDetail client={selectedClient} />
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(CRMPage)
