import React, { useEffect } from "react"
import { connect } from "react-redux"
import { Col, Container, Row } from "reactstrap"

import ClientNewSale from "./ClientNewSale"
import { setBreadcrumbItems } from "../../../store/actions"

const ClientSalesPage = ({ setBreadcrumbItems }) => {
  useEffect(() => {
    const breadcrumbs = [
      { title: "Clientes", link: "/clients/list" },
      { title: "Nova venda", link: "/clients/sales" },
    ]
    setBreadcrumbItems("Nova venda", breadcrumbs)
  }, [setBreadcrumbItems])

  return (
    <Container fluid>
      <Row>
        <Col>
          <ClientNewSale />
        </Col>
      </Row>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(ClientSalesPage)
