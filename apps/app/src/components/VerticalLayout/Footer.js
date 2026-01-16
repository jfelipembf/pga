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
              <img src={pgaLogo} alt="Painel Swim" height="28" />
              <span className="text-muted">
                © {new Date().getFullYear()} Painel Swim · Plataforma para academias de natação
              </span>
            </Col>
          </Row>
        </Container>
      </footer>
    </React.Fragment>
  )
}

export default Footer
