import React from "react"
import { Row, Col } from "reactstrap"
import pgaLogo from "../../../assets/images/pgaLogo.png"

const Header = () => {
    return (
        <div className="bg-primary py-3">
            <Row className="align-items-center justify-content-center m-0">
                <Col xs={5} className="d-flex justify-content-end pe-4">
                    <img
                        src={pgaLogo}
                        alt="Logo"
                        className="img-fluid"
                        style={{
                            filter: 'brightness(0) invert(1)',
                            height: '120px', // Increased from 80px
                            width: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                </Col>
                <Col xs={7} className="border-start border-white border-opacity-25 ps-4 d-flex align-items-center">
                    <div className="text-white">
                        <h4 className="text-white fw-bold mb-1" style={{ fontSize: '1.5rem' }}>Área do Aluno</h4>
                        <p className="text-white-50 mb-0 font-size-14">Consulte seus resultados.</p>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default Header
