import React from "react"
import { Container, Row, Col } from "reactstrap"
import pgaLogo from "../../assets/images/pgaLogo.png"

const Footer = () => {
  return (
    <React.Fragment>
      <footer className="footer">
        <Container fluid={true}>
          <Row>
            <Col sm={12} className="d-flex align-items-center gap-2">
              <img src={pgaLogo} alt="PGA" height="28" />
              <span className="text-muted">
                © {new Date().getFullYear()} PGA · Plataforma para academias de natação
              </span>
            </Col>
          </Row>
        </Container>
      </footer>
    </React.Fragment>
  )
}

export default Footer
