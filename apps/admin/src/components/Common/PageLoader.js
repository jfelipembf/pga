import React from "react"
import { Spinner } from "reactstrap"

const PageLoader = () => {
    return (
        <div
            className="d-flex flex-column justify-content-center align-items-center"
            style={{ minHeight: "60vh" }}
        >
            <Spinner color="primary" />
            <div className="text-muted mt-2">Carregando...</div>
        </div>
    )
}

export default PageLoader
